/**
 * The shape the header reads from /api/session. Pure and client-safe, so the
 * provider and its tests share one definition — same split as lib/cart.ts.
 */
export type SessionSnapshot = { email: string | null; cartCount: number };

export const EMPTY_SESSION: SessionSnapshot = { email: null, cartCount: 0 };

/**
 * The endpoint is ours, but the response still crosses the network, so it is
 * validated rather than trusted. Anything unexpected reads as a signed-out,
 * empty cart: a wrong header is better than a thrown error in the layout.
 */
export function parseSessionResponse(data: unknown): SessionSnapshot {
  if (typeof data !== "object" || data === null) return EMPTY_SESSION;
  const raw = data as Record<string, unknown>;
  const count = raw.cartCount;
  return {
    email: typeof raw.email === "string" && raw.email.length > 0 ? raw.email : null,
    cartCount: typeof count === "number" && Number.isFinite(count) && count > 0 ? count : 0,
  };
}

/**
 * Folds a /api/session response into what the header already shows.
 *
 * The email always comes from the server — it is the whole point of the read.
 * The cart count does not: a cart mutation returns the authoritative count
 * immediately, and a response that was already in flight when that happened
 * carries a pre-mutation number. `localWriteWon` says which is newer.
 */
export function applySessionResponse(
  prev: SessionSnapshot,
  data: unknown,
  { localWriteWon }: { localWriteWon: boolean },
): SessionSnapshot {
  const next = parseSessionResponse(data);
  return {
    email: next.email,
    cartCount: localWriteWon ? prev.cartCount : next.cartCount,
  };
}
