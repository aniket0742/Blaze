/**
 * Unit tests for the pure order-history logic — what a URL segment is allowed
 * to mean, and how an order summarises itself. Run with `npm test`.
 *
 * The reads themselves need a database and are covered by
 * tests/orders.integration.ts, which is also where ownership is proved.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  arrivalText,
  isOrderNumberShaped,
  orderPath,
  orderStatus,
  orderUnits,
} from "../lib/orders";
import { generateOrderNumber } from "../lib/checkout";

test("isOrderNumberShaped: accepts what generateOrderNumber produces", () => {
  for (let i = 0; i < 50; i += 1) {
    assert.equal(isOrderNumberShaped(generateOrderNumber()), true);
  }
});

test("isOrderNumberShaped: rejects anything that is not a bare identifier", () => {
  for (const bad of [
    "",
    " ",
    "BLZ 260920 K4M7X",
    "BLZ-260920-K4M7X ",
    "BLZ_260920",
    "../../etc/passwd",
    "BLZ-%",
    "BLZ-260920-K4M7X' OR '1'='1",
    "a".repeat(33),
    null,
    undefined,
    42,
    {},
    ["BLZ-260920-K4M7X"],
  ]) {
    assert.equal(isOrderNumberShaped(bad), false, JSON.stringify(bad));
  }
});

test("isOrderNumberShaped: is looser than today's format on purpose", () => {
  // A future format change must not make older orders unreachable.
  assert.equal(isOrderNumberShaped("ORD-2027-0001"), true);
  assert.equal(isOrderNumberShaped("blz-260920-k4m7x"), true);
});

test("isOrderNumberShaped: bounds the length that reaches the database", () => {
  assert.equal(isOrderNumberShaped("a".repeat(32)), true);
  assert.equal(isOrderNumberShaped("a".repeat(33)), false);
});

test("orderUnits: counts units, not lines", () => {
  assert.equal(orderUnits([]), 0);
  assert.equal(orderUnits([{ quantity: 1 }]), 1);
  assert.equal(orderUnits([{ quantity: 2 }, { quantity: 3 }]), 5);
});

test("orderPath: points at the details route and escapes the segment", () => {
  assert.equal(orderPath("BLZ-260920-K4M7X"), "/order/BLZ-260920-K4M7X");
  assert.equal(orderPath("a/b"), "/order/a%2Fb");
});

test("orderStatus: labels the status we actually store", () => {
  assert.equal(orderStatus("placed").label, "Order placed");
  assert.ok(orderStatus("placed").className.length > 0);
});

test("orderStatus: an unknown status stays readable rather than blank", () => {
  assert.equal(orderStatus("shipped").label, "shipped");
  assert.ok(orderStatus("shipped").className.length > 0);
  assert.equal(orderStatus("").label, "");
});

test("arrivalText: strips the stored prefix, and passes null through", () => {
  assert.equal(arrivalText("Arrives Tue, 23 Sep"), "Tue, 23 Sep");
  assert.equal(arrivalText("Arrives 23 Sep – 25 Sep"), "23 Sep – 25 Sep");
  assert.equal(arrivalText(null), null);
  // Only a leading prefix is removed.
  assert.equal(arrivalText("Ships in 1 week"), "Ships in 1 week");
});
