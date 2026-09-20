/**
 * The pure, security-relevant half of auth. The Supabase round trip is not
 * covered here — see the manual verification notes in the milestone report.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { friendlyAuthError, safeReturnTo } from "../lib/auth";

test("safeReturnTo: keeps an ordinary relative path", () => {
  assert.equal(safeReturnTo("/cart"), "/cart");
  assert.equal(safeReturnTo("/product/american-football-137"), "/product/american-football-137");
  assert.equal(safeReturnTo("/search?q=shoes&page=2"), "/search?q=shoes&page=2");
});

test("safeReturnTo: rejects absolute URLs to other origins", () => {
  assert.equal(safeReturnTo("https://evil.example.com"), "/");
  assert.equal(safeReturnTo("http://evil.example.com/path"), "/");
});

test("safeReturnTo: rejects protocol-relative URLs", () => {
  // The classic open-redirect bypass: browsers read //host as a full URL.
  assert.equal(safeReturnTo("//evil.example.com"), "/");
  assert.equal(safeReturnTo("//evil.example.com/path"), "/");
});

test("safeReturnTo: rejects backslash variants", () => {
  // Literally "/\evil.example.com" — some browsers normalise \ to /, which
  // would make this protocol-relative.
  assert.equal(safeReturnTo("/" + String.fromCharCode(92) + "evil.example.com"), "/");
  assert.equal(safeReturnTo("/" + String.fromCharCode(92)), "/");
});

test("safeReturnTo: rejects javascript and data URLs", () => {
  assert.equal(safeReturnTo("javascript:alert(1)"), "/");
  assert.equal(safeReturnTo("data:text/html,<script>alert(1)</script>"), "/");
});

test("safeReturnTo: falls back to home for missing or non-string input", () => {
  assert.equal(safeReturnTo(undefined), "/");
  assert.equal(safeReturnTo(null), "/");
  assert.equal(safeReturnTo(""), "/");
  assert.equal(safeReturnTo(42), "/");
  assert.equal(safeReturnTo({}), "/");
});

test("friendlyAuthError: rewrites the two messages shoppers hit", () => {
  assert.equal(friendlyAuthError("Invalid login credentials"), "That email and password don't match.");
  assert.match(friendlyAuthError("User already registered"), /already exists/);
});

test("friendlyAuthError: rewrites Supabase's signup-disabled message", () => {
  // The project setting this surfaces from is an operational state, not a
  // shopper error, so it must not read like developer output.
  assert.match(friendlyAuthError("Signups not allowed for this instance"), /turned off right now/);
});

test("friendlyAuthError: passes anything else through unchanged", () => {
  assert.equal(friendlyAuthError("Password should be at least 6 characters"), "Password should be at least 6 characters");
});
