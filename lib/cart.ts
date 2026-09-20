/**
 * Pure cart types and helpers. Deliberately free of `next/headers` and any
 * database import so the Add to Cart client component can use them without
 * dragging server code into the browser bundle — same split as search-params.
 *
 * Milestone 3 ships only what the product page needs: adding an item. The
 * cart page, quantity editing and removal arrive with the cart milestone.
 */

export const CART_COOKIE = "blaze_cart";

/** One line per product. Short keys keep the cookie far under the 4 kB limit. */
export type CartLine = { i: number; q: number };

/** DummyJSON stock runs into the hundreds; ten per order is plenty for a demo. */
export const MAX_PER_LINE = 10;

/** Guards the cookie against a cart large enough to break the header. */
export const MAX_LINES = 50;

export type AddToCartResult =
  | { status: "added"; lineQty: number; cartQty: number }
  | { status: "capped"; lineQty: number; cartQty: number; reason: "stock" | "limit" }
  | { status: "unavailable" };

/** A hand-edited or truncated cookie is an empty cart, never an error page. */
export function parseCart(raw: string | undefined): CartLine[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (l): l is CartLine =>
          Number.isInteger(l?.i) && Number.isInteger(l?.q) && l.q > 0 && l.q <= MAX_PER_LINE,
      )
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

export function cartQuantity(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.q, 0);
}
