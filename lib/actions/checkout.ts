"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loadCart } from "../cart-store";
import {
  isPaymentMethod,
  normalizePhone,
  validateAddress,
  type CheckoutState,
  type CheckoutValues,
} from "../checkout";
import { createOrder, quoteCart } from "../checkout-server";
import { getUser } from "../supabase/server";

/** Trimmed and length-bounded before anything looks at it, so a hostile post
 *  cannot hand `validateAddress` a megabyte of text. */
function readValues(formData: FormData): CheckoutValues {
  const text = (name: string) => String(formData.get(name) ?? "").trim().slice(0, 200);
  return {
    fullName: text("fullName"),
    phone: text("phone"),
    addressLine1: text("addressLine1"),
    addressLine2: text("addressLine2"),
    city: text("city"),
    state: text("state"),
    postalCode: text("postalCode"),
    payment: text("payment"),
  };
}

/**
 * One action, two steps. `intent=review` validates and hands back a review to
 * confirm; only `intent=place` writes an order. The step lives in the returned
 * state rather than in client state, so the whole flow works with JavaScript
 * off — same reason the auth form is built this way.
 *
 * Nothing priced comes from `formData`. The cart is re-read from the database
 * and re-quoted from the catalog on both steps, so the totals reviewed and the
 * totals stored are computed here, twice, from the same code.
 */
export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const values = readValues(formData);
  const intent = String(formData.get("intent") ?? "review");

  // "Edit details" on the review step. Nothing to check — just go back.
  if (intent === "edit") return { phase: "form", values, errors: {}, formError: null };

  const user = await getUser();
  if (!user?.email) {
    return {
      phase: "form",
      values,
      errors: {},
      formError: "Your session has expired. Sign in again to place this order.",
    };
  }

  const payment = isPaymentMethod(values.payment) ? values.payment : null;
  const errors = validateAddress(values);
  if (!payment) errors.payment = "Choose a payment method.";
  if (!payment || Object.keys(errors).length > 0) {
    return { phase: "form", values, errors, formError: "Check the highlighted fields." };
  }

  const quote = await quoteCart(await loadCart());
  if (quote.lines.length === 0) {
    return {
      phase: "form",
      values,
      errors: {},
      formError: "There is nothing in your cart to order.",
    };
  }
  if (quote.problems.length > 0) {
    return {
      phase: "form",
      values,
      errors: {},
      formError: "Some items changed while you were here. Open your cart to fix them, then come back.",
    };
  }

  if (intent !== "place") return { phase: "review", values, errors: {}, formError: null };

  let orderNumber: string;
  try {
    orderNumber = await createOrder({
      userId: user.id,
      email: user.email,
      address: { ...values, phone: normalizePhone(values.phone) },
      payment,
      quote,
    });
  } catch {
    // The transaction rolled back, so the cart is still intact to retry with.
    return {
      phase: "review",
      values,
      errors: {},
      formError: "We couldn't place your order. Nothing was charged — try again.",
    };
  }

  revalidatePath("/cart");
  revalidatePath("/checkout");
  // Outside the try: redirect() works by throwing, and catching it here would
  // swallow the navigation.
  redirect(`/checkout/success?order=${encodeURIComponent(orderNumber)}`);
}
