/**
 * Server-side cart: the cookie itself, and the reconciled view the cart page
 * renders. Imports `next/headers` and the database, so nothing in here may be
 * imported from a client component — use lib/cart.ts for that.
 */
import { inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import {
  CART_COOKIE,
  EMPTY_CART,
  MAX_LINES,
  clampQuantity,
  parseCart,
  type CartItemView,
  type CartLine,
  type CartView,
} from "./cart";
import { db } from "./db";
import { products } from "./db/schema";
import { deliveryEstimate, slowestShipping } from "./format";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function readCart(): Promise<CartLine[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

export async function writeCart(lines: CartLine[]): Promise<void> {
  (await cookies()).set(CART_COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Joins the cookie against the live catalog and reconciles the difference.
 * A render cannot write cookies, so corrections here are for display only —
 * the cookie is rewritten by the next mutation, which reconciles again.
 */
export async function getCartView(): Promise<CartView> {
  const lines = await readCart();
  if (lines.length === 0) return EMPTY_CART;

  const rows = await db
    .select()
    .from(products)
    .where(
      inArray(
        products.id,
        lines.map((l) => l.i),
      ),
    );
  const byId = new Map(rows.map((p) => [p.id, p]));

  const items: CartItemView[] = [];
  const shipping: string[] = [];
  let staleCount = 0;
  let subtotalPaise = 0;
  let totalQty = 0;

  // Cookie order is insertion order, which is the order the shopper added in.
  for (const line of lines) {
    const product = byId.get(line.i);
    if (!product) {
      staleCount += 1;
      continue;
    }

    const base = {
      id: product.id,
      slug: product.slug,
      title: product.title,
      brand: product.brand,
      thumbnail: product.thumbnail,
      pricePaise: product.pricePaise,
      mrpPaise: product.mrpPaise,
      stock: product.stock,
    };

    if (product.stock < 1) {
      items.push({ ...base, qty: line.q, linePaise: 0, note: { kind: "out-of-stock" } });
      continue;
    }

    const qty = clampQuantity(line.q, product.stock);
    const linePaise = qty * product.pricePaise;
    items.push({
      ...base,
      qty,
      linePaise,
      note: qty < line.q ? { kind: "reduced", from: line.q } : null,
    });

    subtotalPaise += linePaise;
    totalQty += qty;
    shipping.push(product.shippingInformation);
  }

  const slowest = slowestShipping(shipping);
  return {
    items,
    staleCount,
    totalQty,
    subtotalPaise,
    // Delivery is free on every order; there is no shipping-cost model.
    deliveryPaise: 0,
    totalPaise: subtotalPaise,
    arrivesBy: slowest ? deliveryEstimate(slowest) : null,
  };
}
