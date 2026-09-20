/**
 * Client-safe auth types. A "use server" module may only export async
 * functions, so the form's initial state lives here rather than beside the
 * actions — same split as lib/cart.ts.
 */
export type AuthState = { error: string | null };

export const IDLE: AuthState = { error: null };

/**
 * Only same-origin relative paths are followed after sign-in. Without this a
 * crafted `?returnTo=https://elsewhere` turns the form into an open redirect.
 * `//host` is rejected too — browsers read it as protocol-relative. So is a
 * backslash, which some browsers normalise to a forward slash.
 */
export function safeReturnTo(raw: unknown): string {
  const value = typeof raw === "string" ? raw : "";
  if (!value.startsWith("/")) return "/";
  if (value.startsWith("//") || value.startsWith("/\\")) return "/";
  return value;
}

/** Supabase's messages are serviceable but inconsistent; these are the two a
 *  shopper actually needs to understand. */
export function friendlyAuthError(message: string): string {
  if (/invalid login credentials/i.test(message)) return "That email and password don't match.";
  if (/already registered|already been registered/i.test(message)) {
    return "An account with that email already exists.";
  }
  if (/signups? not allowed|signup_disabled/i.test(message)) {
    return "New accounts are turned off right now. Try again later.";
  }
  return message;
}
