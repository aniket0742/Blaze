/**
 * Unit tests for the pure cart logic — the code that decides what a cookie is
 * allowed to mean. Run with `npm test` (Node's built-in runner via tsx, so no
 * test-framework dependency).
 *
 * The server actions are not covered here: they need a live database, and are
 * exercised against the production build instead.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  MAX_LINES,
  MAX_PER_LINE,
  cartQuantity,
  clampQuantity,
  parseCart,
  sumCarts,
} from "../lib/cart";

test("parseCart: a missing or empty cookie is an empty cart", () => {
  assert.deepEqual(parseCart(undefined), []);
  assert.deepEqual(parseCart(""), []);
});

test("parseCart: unparseable JSON is an empty cart, not a throw", () => {
  assert.deepEqual(parseCart("not-json-at-all"), []);
  assert.deepEqual(parseCart('[{"i":1,'), []);
});

test("parseCart: a non-array payload is rejected", () => {
  assert.deepEqual(parseCart('{"i":1,"q":2}'), []);
  assert.deepEqual(parseCart('"hello"'), []);
  assert.deepEqual(parseCart("null"), []);
});

test("parseCart: keeps well-formed lines in cookie order", () => {
  assert.deepEqual(parseCart('[{"i":5,"q":3},{"i":2,"q":1}]'), [
    { i: 5, q: 3 },
    { i: 2, q: 1 },
  ]);
});

test("parseCart: drops lines with a non-integer id or quantity", () => {
  assert.deepEqual(parseCart('[{"i":"5; DROP TABLE","q":1}]'), []);
  assert.deepEqual(parseCart('[{"i":1.5,"q":1}]'), []);
  assert.deepEqual(parseCart('[{"i":5,"q":2.7}]'), []);
  assert.deepEqual(parseCart('[{"i":5,"q":"3"}]'), []);
});

test("parseCart: drops non-positive and over-limit quantities", () => {
  assert.deepEqual(parseCart('[{"i":5,"q":0}]'), []);
  assert.deepEqual(parseCart('[{"i":5,"q":-5}]'), []);
  assert.deepEqual(parseCart(`[{"i":5,"q":${MAX_PER_LINE + 1}}]`), []);
  assert.deepEqual(parseCart('[{"i":5,"q":9999}]'), []);
});

test("parseCart: keeps valid lines alongside invalid ones", () => {
  assert.deepEqual(parseCart('[{"i":1,"q":-1},{"i":2,"q":3},{"i":3,"q":0}]'), [{ i: 2, q: 3 }]);
});

test("parseCart: caps the number of lines", () => {
  const many = JSON.stringify(
    Array.from({ length: MAX_LINES + 20 }, (_, n) => ({ i: n + 1, q: 1 })),
  );
  assert.equal(parseCart(many).length, MAX_LINES);
});

test("cartQuantity: sums line quantities", () => {
  assert.equal(cartQuantity([]), 0);
  assert.equal(cartQuantity([{ i: 1, q: 2 }, { i: 2, q: 3 }]), 5);
});

test("clampQuantity: limits to stock", () => {
  assert.equal(clampQuantity(4, 1), 1);
  assert.equal(clampQuantity(2, 5), 2);
});

test("clampQuantity: limits to the per-order maximum", () => {
  assert.equal(clampQuantity(50, 500), MAX_PER_LINE);
  assert.equal(clampQuantity(MAX_PER_LINE, 500), MAX_PER_LINE);
});

test("clampQuantity: zero and below mean remove the line", () => {
  assert.equal(clampQuantity(0, 5), 0);
  assert.equal(clampQuantity(-3, 5), 0);
});

test("clampQuantity: out of stock yields nothing orderable", () => {
  assert.equal(clampQuantity(3, 0), 0);
});

test("clampQuantity: non-finite input fails closed rather than maxing out", () => {
  assert.equal(clampQuantity(Number("abc"), 5), 0);
  assert.equal(clampQuantity(Number.NaN, 5), 0);
  // Infinity can only come from a tampered call. Dropping the line is safer
  // than reading it as "as many as you have".
  assert.equal(clampQuantity(Infinity, 5), 0);
  assert.equal(clampQuantity(-Infinity, 5), 0);
});

// --- merge rule: guest quantity + user quantity, capped at stock ------------
// Capping needs the catalog, so it is covered by tests/merge.integration.ts.
// These cover the pure summing half.

test("sumCarts: an empty guest cart leaves the account cart alone", () => {
  assert.deepEqual(sumCarts([], [{ i: 1, q: 2 }]), [{ i: 1, q: 2 }]);
});

test("sumCarts: an empty account cart adopts the guest cart", () => {
  assert.deepEqual(sumCarts([{ i: 1, q: 2 }], []), [{ i: 1, q: 2 }]);
});

test("sumCarts: duplicate products SUM rather than taking the maximum", () => {
  // The rejected alternative would give 3 here. See DECISIONS.md.
  assert.deepEqual(sumCarts([{ i: 1, q: 2 }], [{ i: 1, q: 3 }]), [{ i: 1, q: 5 }]);
});

test("sumCarts: disjoint products are unioned, guest items first", () => {
  assert.deepEqual(sumCarts([{ i: 2, q: 1 }], [{ i: 1, q: 4 }]), [
    { i: 2, q: 1 },
    { i: 1, q: 4 },
  ]);
});

test("sumCarts: overlapping and disjoint products together", () => {
  assert.deepEqual(
    sumCarts(
      [
        { i: 1, q: 2 },
        { i: 2, q: 1 },
      ],
      [
        { i: 2, q: 3 },
        { i: 3, q: 5 },
      ],
    ),
    [
      { i: 1, q: 2 },
      { i: 2, q: 4 },
      { i: 3, q: 5 },
    ],
  );
});

test("sumCarts: a sum over the per-order limit is left for stock capping", () => {
  // sumCarts is pure arithmetic; clamping happens in reconcileLines.
  assert.deepEqual(sumCarts([{ i: 1, q: 9 }], [{ i: 1, q: 8 }]), [{ i: 1, q: 17 }]);
  assert.equal(clampQuantity(17, 500), MAX_PER_LINE);
});

test("sumCarts: does not mutate either input", () => {
  const guest = [{ i: 1, q: 2 }];
  const user = [{ i: 1, q: 3 }];
  sumCarts(guest, user);
  assert.deepEqual(guest, [{ i: 1, q: 2 }]);
  assert.deepEqual(user, [{ i: 1, q: 3 }]);
});

test("sumCarts: caps the merged cart at the line limit", () => {
  const guest = Array.from({ length: 40 }, (_, n) => ({ i: n + 1, q: 1 }));
  const user = Array.from({ length: 40 }, (_, n) => ({ i: n + 100, q: 1 }));
  assert.equal(sumCarts(guest, user).length, MAX_LINES);
});
