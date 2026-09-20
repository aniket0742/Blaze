/**
 * Pure cart types and helpers. Deliberately free of `next/headers` and any
 * database import so the Add to Cart client component can use them without
 * dragging server code into the browser bundle — same split as search-params.
 *
 * Everything here is pure: no cookie access, no database. The cookie itself
 * lives in cart-server.ts and the mutations in actions/cart.ts.
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

/** Why a line's cookie quantity could not be honoured as it stands. */
export type CartNote = null | { kind: "reduced"; from: number } | { kind: "out-of-stock" };

/** The fields a cart row actually renders. Deliberately narrower than Product
 *  so the RSC payload doesn't carry descriptions and image arrays per line. */
export type CartItemView = {
  id: number;
  slug: string;
  title: string;
  brand: string | null;
  thumbnail: string;
  pricePaise: number;
  mrpPaise: number;
  stock: number;
  qty: number;
  linePaise: number;
  note: CartNote;
};

export type CartView = {
  items: CartItemView[];
  /** Lines dropped because the product is no longer in the catalog. */
  staleCount: number;
  /** Units that can actually be ordered — excludes out-of-stock lines. */
  totalQty: number;
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  /** Slowest arrival across orderable lines, already formatted. */
  arrivesBy: string | null;
};

/** Every cart mutation returns the new badge count, so the header can update
 *  without a second round trip. */
export type CartMutationResult = { cartQty: number; lineQty: number };

export const EMPTY_CART: CartView = {
  items: [],
  staleCount: 0,
  totalQty: 0,
  subtotalPaise: 0,
  deliveryPaise: 0,
  totalPaise: 0,
  arrivesBy: null,
};

/** Clamp a requested line quantity to what the catalog and the per-order limit
 *  allow. Shared by the cart page controls and the server actions. */
export function clampQuantity(requested: number, stock: number): number {
  const n = Math.trunc(Number(requested));
  if (!Number.isFinite(n) || n < 1) return 0;
  return Math.min(n, stock, MAX_PER_LINE);
}
