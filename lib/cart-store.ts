/**
 * One cart, two backends. Guests keep their cart in the httpOnly cookie;
 * signed-in shoppers keep it in `cart_items`, so it follows them across
 * sessions and devices. Both speak the same `CartLine[]`, which is why the
 * cart page and every mutation are unchanged by the existence of accounts.
 */
import { eq, inArray } from "drizzle-orm";
import { cookies } from "next/headers";
import { CART_COOKIE, MAX_LINES, clampQuantity, parseCart, sumCarts, type CartLine } from "./cart";
import { db } from "./db";
import { cartItems, products } from "./db/schema";
import { getUser } from "./supabase/server";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export async function readGuestCart(): Promise<CartLine[]> {
  return parseCart((await cookies()).get(CART_COOKIE)?.value);
}

async function writeGuestCart(lines: CartLine[]): Promise<void> {
  (await cookies()).set(CART_COOKIE, JSON.stringify(lines.slice(0, MAX_LINES)), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function clearGuestCart(): Promise<void> {
  (await cookies()).delete(CART_COOKIE);
}

export async function readUserCart(userId: string): Promise<CartLine[]> {
  const rows = await db
    .select({ i: cartItems.productId, q: cartItems.quantity })
    .from(cartItems)
    .where(eq(cartItems.userId, userId))
    .orderBy(cartItems.updatedAt);
  return rows;
}

/**
 * Replaces the user's cart wholesale. At most fifty lines, so a delete plus an
 * insert inside one transaction is simpler than diffing and just as correct.
 */
export async function writeUserCart(userId: string, lines: CartLine[]): Promise<void> {
  const capped = lines.slice(0, MAX_LINES);
  await db.transaction(async (tx) => {
    await tx.delete(cartItems).where(eq(cartItems.userId, userId));
    if (capped.length > 0) {
      await tx
        .insert(cartItems)
        .values(capped.map((l) => ({ userId, productId: l.i, quantity: l.q })));
    }
  });
}

/** Drops lines whose product has left the catalog and caps the rest at stock.
 *  `keepOutOfStock` is what separates a cart render from a merge. */
export async function reconcileLines(
  lines: CartLine[],
  { keepOutOfStock }: { keepOutOfStock: boolean },
): Promise<CartLine[]> {
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
    if (stock < 1) return keepOutOfStock ? [line] : [];
    const q = clampQuantity(line.q, stock);
    return q > 0 ? [{ i: line.i, q }] : [];
  });
}

/** Which backend the current request is talking to. */
export async function cartOwner(): Promise<string | null> {
  return (await getUser())?.id ?? null;
}

export async function loadCart(): Promise<CartLine[]> {
  const userId = await cartOwner();
  return userId ? readUserCart(userId) : readGuestCart();
}

export async function saveCart(lines: CartLine[]): Promise<void> {
  const userId = await cartOwner();
  if (userId) await writeUserCart(userId, lines);
  else await writeGuestCart(lines);
}

/**
 * Folds the guest cookie into the account cart at sign-in. Quantities are
 * SUMMED and then capped at current stock; stale and out-of-stock items are
 * dropped. The cookie is cleared only after the write succeeds, so a failure
 * leaves the guest cart intact to retry.
 */
export async function mergeGuestCart(userId: string): Promise<void> {
  const guest = await readGuestCart();
  if (guest.length === 0) return;

  const existing = await readUserCart(userId);
  const merged = await reconcileLines(sumCarts(guest, existing), { keepOutOfStock: false });

  await writeUserCart(userId, merged);
  await clearGuestCart();
}
