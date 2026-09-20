"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { mergeGuestCart } from "../cart-store";
import { createClient } from "../supabase/server";
import { friendlyAuthError, safeReturnTo, type AuthState } from "../auth";

/** Supabase's own minimum. Stated in the UI so it isn't discovered by failing. */
const MIN_PASSWORD = 6;

function credentialsFrom(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = credentialsFrom(formData);
  if (!email || !password) return { error: "Enter your email and password." };

  let userId: string;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendlyAuthError(error.message) };
    userId = data.user.id;
  } catch {
    return { error: "We couldn't reach the sign-in service. Try again." };
  }

  // A cart that fails to merge must not block sign-in — the guest cookie is
  // left untouched, so the next sign-in retries the merge.
  try {
    await mergeGuestCart(userId);
  } catch {
    // Intentionally swallowed; the shopper is signed in either way.
  }

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const { email, password } = credentialsFrom(formData);
  if (!email || !password) return { error: "Enter an email and a password." };
  if (password.length < MIN_PASSWORD) {
    return { error: `Use at least ${MIN_PASSWORD} characters for your password.` };
  }

  let userId: string | undefined;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: friendlyAuthError(error.message) };
    userId = data.user?.id;
    // With email confirmation enabled there is no session yet. We run with it
    // off (see DECISIONS.md), so this is the misconfiguration case.
    if (!data.session) {
      return { error: "Check your inbox to confirm your email, then sign in." };
    }
  } catch {
    return { error: "We couldn't reach the sign-up service. Try again." };
  }

  if (userId) {
    try {
      await mergeGuestCart(userId);
    } catch {
      // Same as sign-in: the account exists, the cookie survives for a retry.
    }
  }

  revalidatePath("/", "layout");
  redirect(safeReturnTo(formData.get("returnTo")));
}

export async function signOut(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Already signed out, or the service is unreachable. Either way, leave.
  }
  revalidatePath("/", "layout");
  redirect("/");
}
