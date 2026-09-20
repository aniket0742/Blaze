"use server";

import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import {
  MAX_LINES,
  MAX_PER_LINE,
  cartQuantity,
  clampQuantity,
  type AddToCartResult,
  type CartMutationResult,
} from "../cart";
import { readCart, writeCart } from "../cart-server";
import { db } from "../db";
import { products } from "../db/schema";

/**
 * Drops lines whose product has left the catalog and clamps the rest to
 * current stock. Runs inside each mutation, so a tampered or stale cookie is
 * corrected on the first write rather than trusted.
 *
 * Out-of-stock lines are deliberately kept: the cart tells the shopper to
 * remove them, so having an unrelated quantity change delete them silently
 * would contradict the page.
 */
async function reconcile(lines: { i: number; q: number }[]) {
  if (lines.length === 0) return [];
  const rows = await db
    .select({ id: products.id, stock: products.stock })
    .from(products)
    .where(
      inArray(
        products.id,
        lines.map((l) => l.i),
      ),
    );
  const stockById = new Map(rows.map((r) => [r.id, r.stock]));

  return lines.flatMap((line) => {
    const stock = stockById.get(line.i);
    if (stock === undefined) return [];
    if (stock < 1) return [line];
    const q = clampQuantity(line.q, stock);
    return q > 0 ? [{ i: line.i, q }] : [];
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
  revalidatePath("/cart");
  const cartQty = cartQuantity(lines);

  if (wanted === lineQty) return { status: "added", lineQty, cartQty };
  return {
    status: "capped",
    lineQty,
    cartQty,
    reason: product.stock < MAX_PER_LINE ? "stock" : "limit",
  };
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
  if (!Number.isInteger(id)) return finish(await reconcile(await readCart()), id);

  const lines = await reconcile(await readCart());
  const line = lines.find((l) => l.i === id);
  if (!line) return finish(lines, id);

  const [product] = await db
    .select({ stock: products.stock })
    .from(products)
    .where(eq(products.id, id))
    .limit(1);

  const qty = product ? clampQuantity(requested, product.stock) : 0;
  const next = qty > 0 ? lines.map((l) => (l.i === id ? { ...l, q: qty } : l)) : drop(lines, id);
  return finish(next, id);
}

export async function removeFromCart(productId: number): Promise<CartMutationResult> {
  const id = Math.trunc(Number(productId));
  const lines = await reconcile(await readCart());
  return finish(Number.isInteger(id) ? drop(lines, id) : lines, id);
}

function drop(lines: { i: number; q: number }[], id: number) {
  return lines.filter((l) => l.i !== id);
}

async function finish(
  lines: { i: number; q: number }[],
  id: number,
): Promise<CartMutationResult> {
  await writeCart(lines);
  revalidatePath("/cart");
  return {
    cartQty: cartQuantity(lines),
    lineQty: lines.find((l) => l.i === id)?.q ?? 0,
  };
}
