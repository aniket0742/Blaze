/**
 * The server side of checkout: what the order actually costs, and writing it.
 *
 * Every number here comes from the catalog. The browser sends an address and
 * a payment choice; it never sends a price, a quantity total or a product
 * title, and nothing it does send is used in the arithmetic.
 */
import { and, eq, inArray, sum } from "drizzle-orm";
import type { CartLine } from "./cart";
import {
  generateOrderNumber,
  type AddressValues,
  type CheckoutLine,
  type CheckoutProblem,
  type CheckoutQuote,
  type PaymentMethod,
} from "./checkout";
import { db } from "./db";
import { cartItems, orderItems, orders, products } from "./db/schema";
import { deliveryEstimate, slowestShipping } from "./format";

const EMPTY_QUOTE: CheckoutQuote = {
  lines: [],
  problems: [],
  totalQty: 0,
  subtotalPaise: 0,
  deliveryPaise: 0,
  totalPaise: 0,
  arrivesBy: null,
};

/**
 * Prices the stored cart against the live catalog and reports anything that
 * would make the order wrong. Both the checkout page and the place-order
 * action call this, so what the shopper reviews and what gets written are
 * computed by the same code from the same source.
 */
export async function quoteCart(cart: CartLine[]): Promise<CheckoutQuote> {
  if (cart.length === 0) return EMPTY_QUOTE;

  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        cart.map((l) => l.i),
      ),
    );
  const byId = new Map(rows.map((p) => [p.id, p]));

  const lines: CheckoutLine[] = [];
  const problems: CheckoutProblem[] = [];
  const shipping: string[] = [];
  let subtotalPaise = 0;
  let totalQty = 0;

  for (const line of cart) {
    const product = byId.get(line.i);
    if (!product) {
      problems.push({ kind: "gone", title: "An item in your cart" });
      continue;
    }
    if (product.stock < 1) {
      problems.push({ kind: "out-of-stock", title: product.title });
      continue;
    }
    if (line.q > product.stock) {
      problems.push({
        kind: "over-stock",
        title: product.title,
        available: product.stock,
        requested: line.q,
      });
      continue;
    }

    const linePaise = line.q * product.pricePaise;
    lines.push({
      productId: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      thumbnail: product.thumbnail,
      unitPricePaise: product.pricePaise,
      quantity: line.q,
      linePaise,
    });
    subtotalPaise += linePaise;
    totalQty += line.q;
    shipping.push(product.shippingInformation);
  }

  const slowest = slowestShipping(shipping);
  return {
    lines,
    problems,
    totalQty,
    subtotalPaise,
    // Delivery is free on every order, the same model the cart uses.
    deliveryPaise: 0,
    totalPaise: subtotalPaise,
    arrivesBy: slowest ? deliveryEstimate(slowest) : null,
  };
}

type OrderInput = {
  userId: string;
  email: string;
  address: AddressValues;
  payment: PaymentMethod;
  quote: CheckoutQuote;
};

/**
 * Writes the order, its snapshotted lines and the cart deletion in one
 * transaction, so the cart is emptied only if the order exists. Returns the
 * order number.
 *
 * Order numbers are random, so a collision is possible in principle; the
 * unique index catches it and we simply pick another. Five attempts against a
 * 28-million-per-day space is far past paranoid.
 */
export async function createOrder(input: OrderInput): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = generateOrderNumber();
    const written = await writeOrder(orderNumber, input);
    if (written) return orderNumber;
  }
  throw new Error("Could not allocate an order number after five attempts.");
}

async function writeOrder(orderNumber: string, input: OrderInput): Promise<boolean> {
  const { userId, email, address, payment, quote } = input;

  return db.transaction(async (tx) => {
    const [order] = await tx
      .insert(orders)
      .values({
        orderNumber,
        userId,
        email,
        fullName: address.fullName,
        phone: address.phone,
        addressLine1: address.addressLine1,
        addressLine2: address.addressLine2 || null,
        city: address.city,
        state: address.state,
        postalCode: address.postalCode,
        paymentMethod: payment,
        subtotalPaise: quote.subtotalPaise,
        deliveryPaise: quote.deliveryPaise,
        totalPaise: quote.totalPaise,
        arrivesBy: quote.arrivesBy,
      })
      .onConflictDoNothing({ target: orders.orderNumber })
      .returning({ id: orders.id });

    // The number was taken. Nothing has been written; the caller retries.
    if (!order) return false;

    await tx.insert(orderItems).values(
      quote.lines.map((line) => ({
        orderId: order.id,
        productId: line.productId,
        slug: line.slug,
        title: line.title,
        brand: line.brand,
        thumbnail: line.thumbnail,
        unitPricePaise: line.unitPricePaise,
        quantity: line.quantity,
        linePaise: line.linePaise,
      })),
    );

    // Only now, and only for the account that placed the order. A guest
    // cookie is untouched — checkout requires a session.
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    return true;
  });
}

/** The confirmation read. Scoped to the owner, so an order number that is
 *  guessed or forwarded does not show someone else's order. */
export async function getOwnOrder(orderNumber: string, userId: string) {
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      totalPaise: orders.totalPaise,
      arrivesBy: orders.arrivesBy,
      paymentMethod: orders.paymentMethod,
      fullName: orders.fullName,
      city: orders.city,
      state: orders.state,
      postalCode: orders.postalCode,
      placedAt: orders.placedAt,
    })
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1);
  if (!order) return null;

  const [counted] = await db
    .select({ units: sum(orderItems.quantity) })
    .from(orderItems)
    .where(eq(orderItems.orderId, order.id));

  return { ...order, units: Number(counted?.units ?? 0) };
}
