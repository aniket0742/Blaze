"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  MAX_LINES,
  MAX_PER_LINE,
  cartQuantity,
  clampQuantity,
  type AddToCartResult,
  type CartMutationResult,
} from "../cart";
import { loadCart, reconcileLines, saveCart } from "../cart-store";
import { db } from "../db";
import { products } from "../db/schema";

/**
 * Adds to whichever cart this request owns. The product and the quantity are
 * re-checked here because the selector in the browser is only a convenience —
 * this is the boundary that enforces them. With no stock data, a product is
 * available if it is in the catalog, which means it has a real current price.
 */
export async function addToCart(productId: number, requested: number): Promise<AddToCartResult> {
  const id = Math.trunc(Number(productId));
  const qty = Math.min(Math.max(Math.trunc(Number(requested)) || 1, 1), MAX_PER_LINE);
  if (!Number.isInteger(id)) return { status: "unavailable" };

  const [product] = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) return { status: "unavailable" };

  const lines = await loadCart();
  const existing = lines.find((l) => l.i === product.id);
  const wanted = (existing?.q ?? 0) + qty;
  const lineQty = Math.min(wanted, MAX_PER_LINE);

  if (existing) existing.q = lineQty;
  else if (lines.length < MAX_LINES) lines.push({ i: product.id, q: lineQty });
  else return { status: "unavailable" };

  await saveCart(lines);
  revalidatePath("/cart");
  const cartQty = cartQuantity(lines);

  return wanted === lineQty
    ? { status: "added", lineQty, cartQty }
    : { status: "capped", lineQty, cartQty };
}

/**
 * Sets one line to an absolute quantity. A quantity of zero or less removes
 * the line, which is what the decrease button does at one.
 */
export async function setCartQuantity(
  productId: number,
  requested: number,
): Promise<CartMutationResult> {
  const id = Math.trunc(Number(productId));
  const lines = await reconcileLines(await loadCart());
  if (!Number.isInteger(id) || !lines.some((l) => l.i === id)) return finish(lines, id);

  const qty = clampQuantity(requested);
  const next = qty > 0 ? lines.map((l) => (l.i === id ? { ...l, q: qty } : l)) : drop(lines, id);
  return finish(next, id);
}

export async function removeFromCart(productId: number): Promise<CartMutationResult> {
  const id = Math.trunc(Number(productId));
  const lines = await reconcileLines(await loadCart());
  return finish(Number.isInteger(id) ? drop(lines, id) : lines, id);
}

function drop(lines: { i: number; q: number }[], id: number) {
  return lines.filter((l) => l.i !== id);
}

async function finish(
  lines: { i: number; q: number }[],
  id: number,
): Promise<CartMutationResult> {
  await saveCart(lines);
  revalidatePath("/cart");
  return {
    cartQty: cartQuantity(lines),
    lineQty: lines.find((l) => l.i === id)?.q ?? 0,
  };
}
