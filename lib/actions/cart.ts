"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { db } from "../db";
import { products } from "../db/schema";
import {
  CART_COOKIE,
  MAX_LINES,
  MAX_PER_LINE,
  cartQuantity,
  parseCart,
  type AddToCartResult,
  type CartLine,
} from "../cart";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

async function readCart(): Promise<CartLine[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

async function writeCart(lines: CartLine[]): Promise<void> {
  (await cookies()).set(CART_COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * Adds to the guest cart held in an httpOnly cookie. Stock and quantity are
 * re-checked here because the quantity selector in the browser is only a
 * convenience — this is the boundary that actually enforces them.
 */
export async function addToCart(productId: number, requested: number): Promise<AddToCartResult> {
  const id = Math.trunc(Number(productId));
  const qty = Math.min(Math.max(Math.trunc(Number(requested)) || 1, 1), MAX_PER_LINE);
  if (!Number.isInteger(id)) return { status: "unavailable" };

  const [product] = await db
    .select({ id: products.id, stock: products.stock })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product || product.stock < 1) return { status: "unavailable" };

  const lines = await readCart();
  const existing = lines.find((l) => l.i === product.id);
  const wanted = (existing?.q ?? 0) + qty;
  const lineQty = Math.min(wanted, product.stock, MAX_PER_LINE);

  if (existing) existing.q = lineQty;
  else if (lines.length < MAX_LINES) lines.push({ i: product.id, q: lineQty });
  else return { status: "unavailable" };

  await writeCart(lines);
  const cartQty = cartQuantity(lines);

  if (wanted === lineQty) return { status: "added", lineQty, cartQty };
  return {
    status: "capped",
    lineQty,
    cartQty,
    reason: product.stock < MAX_PER_LINE ? "stock" : "limit",
  };
}
