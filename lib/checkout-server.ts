/**
 * The server side of checkout: what the order actually costs, and writing it.
 *
 * Every number here comes from the catalog. The browser sends an address and
 * a payment choice; it never sends a price, a quantity total or a product
 * title, and nothing it does send is used in the arithmetic.
 */
import { eq, inArray } from "drizzle-orm";
import { MAX_PER_LINE, type CartLine } from "./cart";
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

const EMPTY_QUOTE: CheckoutQuote = {
  lines: [],
  problems: [],
  totalQty: 0,
  subtotalPaise: 0,
  deliveryPaise: 0,
  totalPaise: 0,
};

/**
 * Prices the stored cart against the live catalog and reports anything that
 * would make the order wrong. Both the checkout page and the place-order
 * action call this, so what the shopper reviews and what gets written are
 * computed by the same code from the same source.
 *
 * Availability is being in the catalog: every product there has a real
 * current price, and there is no stock data to check against. See DECISIONS.md.
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
  let subtotalPaise = 0;
  let totalQty = 0;

  for (const line of cart) {
    const product = byId.get(line.i);
    if (!product) {
      problems.push({ kind: "gone", title: "An item in your cart" });
      continue;
    }
    // The cart never stores more than the limit; a row that does was not
    // written by Blaze, and is refused rather than silently trimmed.
    if (line.q > MAX_PER_LINE) {
      problems.push({
        kind: "over-limit",
        title: product.title,
        limit: MAX_PER_LINE,
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
  }

  return {
    lines,
    problems,
    totalQty,
    subtotalPaise,
    // Delivery is free on every order, the same model the cart uses.
    deliveryPaise: 0,
    totalPaise: subtotalPaise,
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
