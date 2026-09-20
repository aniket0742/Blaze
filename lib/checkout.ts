/**
 * Pure checkout logic: what a valid address is, what an order number looks
 * like, and the shape the form state travels in. No `next/headers`, no
 * database — the client form imports from here, and so do the unit tests.
 *
 * A "use server" module may only export async functions, which is why the
 * idle state and the constants live here rather than beside the action.
 * Same split as lib/cart.ts and lib/auth.ts.
 */

/** Both are demo-only. We never collect or store card details — see DECISIONS.md. */
export const PAYMENT_METHODS = ["demo_card", "demo_cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  demo_card: "Demo card ending 4242",
  demo_cod: "Cash on delivery (demo)",
};

export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return PAYMENT_METHODS.includes(value as PaymentMethod);
}

/** 28 states and 8 union territories. A select rather than a free text field:
 *  it is faster on mobile and it makes the address checkable. */
export const INDIAN_STATES = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar",
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", "Karnataka",
  "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
] as const;

export type AddressValues = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
};

export type CheckoutValues = AddressValues & { payment: string };

export type CheckoutField = keyof CheckoutValues;

export const EMPTY_VALUES: CheckoutValues = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  payment: "demo_card",
};

/** `review` is a real step: the action returns it once the address checks out,
 *  and only a second submit with `intent=place` writes anything. */
export type CheckoutPhase = "form" | "review";

export type CheckoutState = {
  phase: CheckoutPhase;
  values: CheckoutValues;
  errors: Partial<Record<CheckoutField, string>>;
  formError: string | null;
};

export const CHECKOUT_IDLE: CheckoutState = {
  phase: "form",
  values: EMPTY_VALUES,
  errors: {},
  formError: null,
};

/** Keeps the digits, drops a +91 or a leading 0. Returns the ten-digit
 *  subscriber number, or "" when it is not one. */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const local = digits.replace(/^(91|0)(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(local) ? local : "";
}

function lengthError(label: string, value: string, min: number, max: number): string | null {
  if (value.length === 0) return `${label} is required.`;
  if (value.length < min) return `${label} looks too short.`;
  if (value.length > max) return `${label} must be ${max} characters or fewer.`;
  return null;
}

/**
 * Validates one address. Returns a map of field to message — empty means
 * valid. The server runs this whatever the browser did; the `required` and
 * `pattern` attributes on the inputs are a convenience, not the check.
 */
export function validateAddress(values: AddressValues): Partial<Record<CheckoutField, string>> {
  const errors: Partial<Record<CheckoutField, string>> = {};

  const name = lengthError("Full name", values.fullName, 2, 80);
  if (name) errors.fullName = name;

  if (values.phone.length === 0) errors.phone = "Phone number is required.";
  else if (!normalizePhone(values.phone)) {
    errors.phone = "Enter a 10-digit Indian mobile number.";
  }

  const line1 = lengthError("Address", values.addressLine1, 4, 120);
  if (line1) errors.addressLine1 = line1;

  if (values.addressLine2.length > 120) {
    errors.addressLine2 = "Address line 2 must be 120 characters or fewer.";
  }

  const city = lengthError("City", values.city, 2, 60);
  if (city) errors.city = city;

  if (values.state.length === 0) errors.state = "Select a state.";
  else if (!INDIAN_STATES.includes(values.state as (typeof INDIAN_STATES)[number])) {
    errors.state = "Select a state from the list.";
  }

  if (values.postalCode.length === 0) errors.postalCode = "PIN code is required.";
  else if (!/^[1-9]\d{5}$/.test(values.postalCode)) {
    errors.postalCode = "Enter a 6-digit PIN code.";
  }

  return errors;
}

/** Unambiguous in print and over the phone: no 0/O, no 1/I/L. */
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

/**
 * A human-readable order number: `BLZ-260920-K4M7X`. The date makes it
 * scannable, the five random characters make it unguessable enough that one
 * order number does not imply the next. Uniqueness is enforced by the unique
 * index on `orders.order_number`, not by hope — the caller retries on
 * conflict. `random` is injectable so the collision path is testable.
 */
export function generateOrderNumber(now: Date = new Date(), random: () => number = Math.random): string {
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  let suffix = "";
  for (let i = 0; i < 5; i += 1) {
    suffix += ALPHABET[Math.floor(random() * ALPHABET.length) % ALPHABET.length];
  }
  return `BLZ-${yy}${mm}${dd}-${suffix}`;
}

/** One priced line of an order, computed from the catalog and never from the
 *  browser. This is also exactly what gets snapshotted into `order_items`. */
export type CheckoutLine = {
  productId: number;
  slug: string;
  title: string;
  brand: string | null;
  thumbnail: string;
  unitPricePaise: number;
  quantity: number;
  linePaise: number;
};

/** Why an order cannot be placed as it stands. Each one names the item, so
 *  the shopper is told what to fix rather than "something went wrong". */
export type CheckoutProblem =
  | { kind: "gone"; title: string }
  | { kind: "out-of-stock"; title: string }
  | { kind: "over-stock"; title: string; available: number; requested: number };

export type CheckoutQuote = {
  lines: CheckoutLine[];
  problems: CheckoutProblem[];
  totalQty: number;
  subtotalPaise: number;
  deliveryPaise: number;
  totalPaise: number;
  arrivesBy: string | null;
};

export function problemText(problem: CheckoutProblem): string {
  switch (problem.kind) {
    case "gone":
      return `${problem.title} is no longer in our catalog.`;
    case "out-of-stock":
      return `${problem.title} is out of stock.`;
    case "over-stock":
      return `Only ${problem.available} of ${problem.title} left — your cart has ${problem.requested}.`;
  }
}
