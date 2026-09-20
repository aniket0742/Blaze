/**
 * The header's session parsing. This is the contract between /api/session and
 * the provider that decides whether a shopper sees "Sign in" or their account
 * menu, so a malformed response must degrade to signed-out rather than throw
 * inside the root layout.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { EMPTY_SESSION, applySessionResponse, parseSessionResponse } from "../lib/session";

test("parseSessionResponse: a signed-in response is read as signed in", () => {
  assert.deepEqual(parseSessionResponse({ email: "shopper@example.com", cartCount: 3 }), {
    email: "shopper@example.com",
    cartCount: 3,
  });
});

test("parseSessionResponse: a guest response is read as signed out", () => {
  assert.deepEqual(parseSessionResponse({ email: null, cartCount: 0 }), EMPTY_SESSION);
});

test("parseSessionResponse: a signed-in shopper with an empty cart keeps their email", () => {
  // The regression: treating a zero cart as "no session" would hide the
  // account menu from someone who is signed in.
  assert.deepEqual(parseSessionResponse({ email: "shopper@example.com", cartCount: 0 }), {
    email: "shopper@example.com",
    cartCount: 0,
  });
});

test("parseSessionResponse: a guest with a cart keeps the count", () => {
  assert.deepEqual(parseSessionResponse({ email: null, cartCount: 5 }), {
    email: null,
    cartCount: 5,
  });
});

test("parseSessionResponse: an empty-string email is not a session", () => {
  assert.equal(parseSessionResponse({ email: "", cartCount: 1 }).email, null);
});

test("parseSessionResponse: non-string emails are rejected", () => {
  assert.equal(parseSessionResponse({ email: 42, cartCount: 1 }).email, null);
  assert.equal(parseSessionResponse({ email: { a: 1 }, cartCount: 1 }).email, null);
  assert.equal(parseSessionResponse({ cartCount: 1 }).email, null);
});

test("parseSessionResponse: bad counts fall back to zero", () => {
  assert.equal(parseSessionResponse({ email: null, cartCount: -3 }).cartCount, 0);
  assert.equal(parseSessionResponse({ email: null, cartCount: "7" }).cartCount, 0);
  assert.equal(parseSessionResponse({ email: null, cartCount: Number.NaN }).cartCount, 0);
  assert.equal(parseSessionResponse({ email: null, cartCount: Infinity }).cartCount, 0);
  assert.equal(parseSessionResponse({ email: null }).cartCount, 0);
});

test("parseSessionResponse: a failed or non-object response is signed out", () => {
  assert.deepEqual(parseSessionResponse(null), EMPTY_SESSION);
  assert.deepEqual(parseSessionResponse(undefined), EMPTY_SESSION);
  assert.deepEqual(parseSessionResponse("nope"), EMPTY_SESSION);
  assert.deepEqual(parseSessionResponse([]), EMPTY_SESSION);
});

// --- folding a response into what the header already shows ------------------

const GUEST = { email: null, cartCount: 0 };
const SIGNED_IN = { email: "shopper@example.com", cartCount: 3 };

test("applySessionResponse: signing in replaces a guest header", () => {
  // The bug this milestone fixed: the header kept the stale guest session
  // because the provider never re-read after the sign-in redirect.
  assert.deepEqual(applySessionResponse(GUEST, SIGNED_IN, { localWriteWon: false }), SIGNED_IN);
});

test("applySessionResponse: signing out replaces a signed-in header", () => {
  assert.deepEqual(applySessionResponse(SIGNED_IN, GUEST, { localWriteWon: false }), GUEST);
});

test("applySessionResponse: the email always comes from the server", () => {
  // Even when a local cart write is newer, the session itself is not local.
  assert.equal(
    applySessionResponse(GUEST, SIGNED_IN, { localWriteWon: true }).email,
    "shopper@example.com",
  );
  assert.equal(applySessionResponse(SIGNED_IN, GUEST, { localWriteWon: true }).email, null);
});

test("applySessionResponse: a newer local cart write survives a slow response", () => {
  const prev = { email: "shopper@example.com", cartCount: 9 };
  const stale = { email: "shopper@example.com", cartCount: 3 };
  assert.equal(applySessionResponse(prev, stale, { localWriteWon: true }).cartCount, 9);
});

test("applySessionResponse: otherwise the server count wins", () => {
  const prev = { email: "shopper@example.com", cartCount: 9 };
  const fresh = { email: "shopper@example.com", cartCount: 3 };
  assert.equal(applySessionResponse(prev, fresh, { localWriteWon: false }).cartCount, 3);
});

test("applySessionResponse: a malformed response signs the header out safely", () => {
  assert.deepEqual(applySessionResponse(SIGNED_IN, "boom", { localWriteWon: false }), GUEST);
});
