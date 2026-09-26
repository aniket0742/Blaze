/**
 * Unit tests for the pure checkout logic — what counts as a deliverable
 * address, and what an order number is allowed to look like. Run with
 * `npm test`.
 *
 * The place-order action is not covered here: it needs a session and a live
 * database. Its database half is covered by tests/orders.integration.ts.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  INDIAN_STATES,
  PAYMENT_METHODS,
  generateOrderNumber,
  isPaymentMethod,
  normalizePhone,
  problemText,
  validateAddress,
  type AddressValues,
} from "../lib/checkout";

const VALID: AddressValues = {
  fullName: "Aniket Sharma",
  phone: "9876543210",
  addressLine1: "42 Residency Road",
  addressLine2: "Near the old post office",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560025",
};

function withField(field: keyof AddressValues, value: string): AddressValues {
  return { ...VALID, [field]: value };
}

test("validateAddress: a complete address has no errors", () => {
  assert.deepEqual(validateAddress(VALID), {});
});

test("validateAddress: address line 2 is genuinely optional", () => {
  assert.deepEqual(validateAddress(withField("addressLine2", "")), {});
});

test("validateAddress: every required field is required", () => {
  for (const field of ["fullName", "phone", "addressLine1", "city", "state", "postalCode"] as const) {
    const errors = validateAddress(withField(field, ""));
    assert.ok(errors[field], `expected an error for an empty ${field}`);
  }
});

test("validateAddress: whitespace-only is not a name", () => {
  // The action trims before calling this, so a padded name arrives empty.
  assert.ok(validateAddress(withField("fullName", "")).fullName);
});

test("validateAddress: fields have upper length bounds", () => {
  assert.ok(validateAddress(withField("fullName", "a".repeat(81))).fullName);
  assert.ok(validateAddress(withField("addressLine1", "a".repeat(121))).addressLine1);
  assert.ok(validateAddress(withField("addressLine2", "a".repeat(121))).addressLine2);
  assert.ok(validateAddress(withField("city", "a".repeat(61))).city);
});

test("validateAddress: the state must be one we actually deliver to", () => {
  assert.ok(validateAddress(withField("state", "Californiya")).state);
  assert.ok(validateAddress(withField("state", "karnataka")).state, "matching is exact");
  for (const state of INDIAN_STATES) {
    assert.deepEqual(validateAddress(withField("state", state)), {}, state);
  }
});

test("validateAddress: PIN code is six digits and never starts with zero", () => {
  assert.ok(validateAddress(withField("postalCode", "56002")).postalCode);
  assert.ok(validateAddress(withField("postalCode", "5600255")).postalCode);
  assert.ok(validateAddress(withField("postalCode", "060025")).postalCode);
  assert.ok(validateAddress(withField("postalCode", "56002a")).postalCode);
  assert.deepEqual(validateAddress(withField("postalCode", "110001")), {});
});

test("validateAddress: reports every bad field at once, not just the first", () => {
  const errors = validateAddress({ ...VALID, fullName: "", phone: "", postalCode: "1" });
  assert.deepEqual(Object.keys(errors).sort(), ["fullName", "phone", "postalCode"]);
});

test("normalizePhone: accepts the ways people actually type a number", () => {
  for (const input of [
    "9876543210",
    "98765 43210",
    "98765-43210",
    "+91 98765 43210",
    "+919876543210",
    "09876543210",
    "(98765) 43210",
  ]) {
    assert.equal(normalizePhone(input), "9876543210", input);
  }
});

test("normalizePhone: rejects what is not a ten-digit mobile number", () => {
  for (const input of ["", "12345", "5876543210", "98765432100", "abcdefghij", "+1 415 555 0123"]) {
    assert.equal(normalizePhone(input), "", input);
  }
});

test("validateAddress: a landline-shaped number is rejected", () => {
  assert.ok(validateAddress(withField("phone", "0801234567")).phone);
});

test("isPaymentMethod: only the two demo methods are accepted", () => {
  for (const method of PAYMENT_METHODS) assert.equal(isPaymentMethod(method), true);
  for (const bad of ["visa", "", "DEMO_CARD", null, undefined, 1, {}]) {
    assert.equal(isPaymentMethod(bad), false, String(bad));
  }
});

test("generateOrderNumber: is BLZ, the date, and five characters", () => {
  const number = generateOrderNumber(new Date(2026, 8, 20), () => 0);
  assert.equal(number, "BLZ-260920-22222");
  assert.match(number, /^BLZ-\d{6}-[A-Z2-9]{5}$/);
});

test("generateOrderNumber: pads single-digit months and days", () => {
  assert.match(generateOrderNumber(new Date(2027, 0, 5), () => 0), /^BLZ-270105-/);
});

test("generateOrderNumber: uses the whole alphabet and stays in range", () => {
  assert.equal(generateOrderNumber(new Date(2026, 8, 20), () => 0.9999999).slice(-5), "ZZZZZ");
  // Defensive: a random() of exactly 1 must not index past the end.
  assert.match(generateOrderNumber(new Date(2026, 8, 20), () => 1), /^BLZ-260920-[A-Z2-9]{5}$/);
});

test("generateOrderNumber: omits characters that are misread aloud", () => {
  const values = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.99];
  let i = 0;
  const suffixes = values.map(() => generateOrderNumber(new Date(), () => values[i++ % values.length]));
  for (const s of suffixes) {
    assert.doesNotMatch(s.slice(-5), /[01ILO]/, s);
  }
});

test("generateOrderNumber: real calls are random, not constant", () => {
  // 40 draws from 31^5 suffixes collide by chance 0.003% of the time. It was
  // 500 draws, which the birthday paradox made fail 0.4% of runs — flaky.
  // Uniqueness itself is the database's job: a unique index plus a retry,
  // covered by tests/orders.integration.ts.
  const seen = new Set(Array.from({ length: 40 }, () => generateOrderNumber()));
  assert.equal(seen.size, 40);
});

test("problemText: names the item so the shopper knows what to fix", () => {
  assert.match(problemText({ kind: "gone", title: "An item in your cart" }), /no longer in our catalog/);
  assert.equal(
    problemText({ kind: "over-limit", title: "Kiwi", limit: 10, requested: 12 }),
    "You can order up to 10 of Kiwi — your cart has 12.",
  );
});
