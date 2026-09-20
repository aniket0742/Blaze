/**
 * Integration coverage for the guest-cart merge against the real catalog.
 * Needs DATABASE_URL; run with `npm run test:db`.
 *
 * Supabase Auth is not involved: the merge takes a user id, so a synthetic
 * UUID exercises the same path a real session would. Every test cleans up
 * after itself and no seeded catalog row is modified.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { eq } from "drizzle-orm";
import { MAX_PER_LINE, sumCarts, type CartLine } from "../lib/cart";
import { reconcileLines, readUserCart, writeUserCart } from "../lib/cart-store";
import { db } from "../lib/db";
import { cartItems } from "../lib/db/schema";

// Fixtures from the seeded catalog, verified in earlier milestones.
const IN_STOCK = 137; // American Football, stock 53
const LOW_STOCK = 105; // Apple MagSafe Battery Pack, stock 1
const OUT_OF_STOCK = 132; // Samsung Galaxy S8, stock 0
const GONE = 999999; // never in the catalog

const users: string[] = [];
function newUser(): string {
  const id = randomUUID();
  users.push(id);
  return id;
}

/** The merge, minus the cookie I/O: sum, then cap and drop against stock. */
async function merge(guest: CartLine[], user: CartLine[]): Promise<CartLine[]> {
  return reconcileLines(sumCarts(guest, user), { keepOutOfStock: false });
}

after(async () => {
  for (const id of users) await db.delete(cartItems).where(eq(cartItems.userId, id));
  process.exit(0);
});

test("a user cart round-trips through the database", async () => {
  const user = newUser();
  await writeUserCart(user, [
    { i: IN_STOCK, q: 2 },
    { i: LOW_STOCK, q: 1 },
  ]);
  const read = await readUserCart(user);
  assert.deepEqual(
    [...read].sort((a, b) => a.i - b.i),
    [
      { i: LOW_STOCK, q: 1 },
      { i: IN_STOCK, q: 2 },
    ].sort((a, b) => a.i - b.i),
  );
});

test("writing replaces the previous cart rather than appending", async () => {
  const user = newUser();
  await writeUserCart(user, [{ i: IN_STOCK, q: 2 }]);
  await writeUserCart(user, [{ i: LOW_STOCK, q: 1 }]);
  assert.deepEqual(await readUserCart(user), [{ i: LOW_STOCK, q: 1 }]);
});

test("writing an empty cart clears it", async () => {
  const user = newUser();
  await writeUserCart(user, [{ i: IN_STOCK, q: 2 }]);
  await writeUserCart(user, []);
  assert.deepEqual(await readUserCart(user), []);
});

test("two users' carts do not interfere", async () => {
  const a = newUser();
  const b = newUser();
  await writeUserCart(a, [{ i: IN_STOCK, q: 2 }]);
  await writeUserCart(b, [{ i: LOW_STOCK, q: 1 }]);
  assert.deepEqual(await readUserCart(a), [{ i: IN_STOCK, q: 2 }]);
  assert.deepEqual(await readUserCart(b), [{ i: LOW_STOCK, q: 1 }]);
});

test("merge SUMS duplicate products", async () => {
  assert.deepEqual(await merge([{ i: IN_STOCK, q: 2 }], [{ i: IN_STOCK, q: 3 }]), [
    { i: IN_STOCK, q: 5 },
  ]);
});

test("merge caps the summed quantity at available stock", async () => {
  // Stock is 1, so 1 + 1 must land on 1, not 2.
  assert.deepEqual(await merge([{ i: LOW_STOCK, q: 1 }], [{ i: LOW_STOCK, q: 1 }]), [
    { i: LOW_STOCK, q: 1 },
  ]);
});

test("merge caps the summed quantity at the per-order limit", async () => {
  const merged = await merge([{ i: IN_STOCK, q: 9 }], [{ i: IN_STOCK, q: 8 }]);
  assert.deepEqual(merged, [{ i: IN_STOCK, q: MAX_PER_LINE }]);
});

test("merge drops products that have left the catalog", async () => {
  assert.deepEqual(await merge([{ i: GONE, q: 3 }], [{ i: IN_STOCK, q: 1 }]), [
    { i: IN_STOCK, q: 1 },
  ]);
});

test("merge drops out-of-stock products", async () => {
  assert.deepEqual(await merge([{ i: OUT_OF_STOCK, q: 1 }], [{ i: IN_STOCK, q: 1 }]), [
    { i: IN_STOCK, q: 1 },
  ]);
});

test("merge of two empty carts is empty", async () => {
  assert.deepEqual(await merge([], []), []);
});

test("merge preserves an account cart when the guest cart is empty", async () => {
  assert.deepEqual(await merge([], [{ i: IN_STOCK, q: 4 }]), [{ i: IN_STOCK, q: 4 }]);
});

test("a merged cart persists for the next session", async () => {
  const user = newUser();
  await writeUserCart(user, [{ i: IN_STOCK, q: 3 }]);
  const merged = await merge([{ i: IN_STOCK, q: 2 }], await readUserCart(user));
  await writeUserCart(user, merged);
  // A later, independent read is what "across sessions and devices" means.
  assert.deepEqual(await readUserCart(user), [{ i: IN_STOCK, q: 5 }]);
});
