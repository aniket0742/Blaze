/**
 * Integration coverage for checkout against the real catalog and a real
 * database. Needs DATABASE_URL; run with `npm run test:db`.
 *
 * Supabase Auth is not involved: `createOrder` takes a user id, so a
 * synthetic UUID exercises the same path a real session would. Every test
 * cleans up after itself, and no seeded catalog row is left modified — the
 * one test that needs a price to change does it inside a transaction it
 * deliberately rolls back.
 */
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { after, test } from "node:test";
import { eq, inArray } from "drizzle-orm";
import { createOrder, quoteCart } from "../lib/checkout-server";
import { writeUserCart, readUserCart } from "../lib/cart-store";
import type { AddressValues } from "../lib/checkout";
import { db } from "../lib/db";
import { cartItems, orderItems, orders, products } from "../lib/db/schema";

// Fixtures from the seeded catalog, verified in earlier milestones.
const IN_STOCK = 137; // American Football, stock 53
const LOW_STOCK = 105; // Apple MagSafe Battery Pack, stock 1
const OUT_OF_STOCK = 132; // Samsung Galaxy S8, stock 0
const GONE = 999999; // never in the catalog

const ADDRESS: AddressValues = {
  fullName: "Test Shopper",
  phone: "9876543210",
  addressLine1: "42 Residency Road",
  addressLine2: "",
  city: "Bengaluru",
  state: "Karnataka",
  postalCode: "560025",
};

const users: string[] = [];
function newUser(): string {
  const id = randomUUID();
  users.push(id);
  return id;
}

async function product(id: number) {
  const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  assert.ok(row, `fixture product ${id} is missing — reseed the catalog`);
  return row;
}

after(async () => {
  for (const id of users) {
    await db.delete(orders).where(eq(orders.userId, id)); // order_items cascade
    await db.delete(cartItems).where(eq(cartItems.userId, id));
  }
  process.exit(0);
});

test("quoteCart: an empty cart quotes to zero", async () => {
  const quote = await quoteCart([]);
  assert.deepEqual(quote.lines, []);
  assert.deepEqual(quote.problems, []);
  assert.equal(quote.totalQty, 0);
  assert.equal(quote.totalPaise, 0);
});

test("quoteCart: every figure comes from the catalog, not the caller", async () => {
  const [a, b] = [await product(IN_STOCK), await product(LOW_STOCK)];
  const quote = await quoteCart([
    { i: a.id, q: 3 },
    { i: b.id, q: 1 },
  ]);

  assert.deepEqual(quote.problems, []);
  assert.equal(quote.lines.length, 2);

  const lineA = quote.lines.find((l) => l.productId === a.id)!;
  assert.equal(lineA.unitPricePaise, a.pricePaise);
  assert.equal(lineA.linePaise, 3 * a.pricePaise);
  assert.equal(lineA.title, a.title);
  assert.equal(lineA.slug, a.slug);

  assert.equal(quote.totalQty, 4);
  assert.equal(quote.subtotalPaise, 3 * a.pricePaise + b.pricePaise);
  assert.equal(quote.deliveryPaise, 0, "delivery is free on every order");
  assert.equal(quote.totalPaise, quote.subtotalPaise);
  assert.ok(quote.arrivesBy, "an orderable cart always has a delivery estimate");
});

test("quoteCart: a product that left the catalog is a problem, not a line", async () => {
  const quote = await quoteCart([{ i: GONE, q: 1 }]);
  assert.equal(quote.lines.length, 0);
  assert.deepEqual(
    quote.problems.map((p) => p.kind),
    ["gone"],
  );
  assert.equal(quote.totalPaise, 0);
});

test("quoteCart: an out-of-stock product blocks the order", async () => {
  const gone = await product(OUT_OF_STOCK);
  assert.equal(gone.stock, 0, "fixture expects this product to be out of stock");

  const quote = await quoteCart([{ i: OUT_OF_STOCK, q: 1 }]);
  assert.equal(quote.lines.length, 0);
  assert.deepEqual(quote.problems, [{ kind: "out-of-stock", title: gone.title }]);
});

test("quoteCart: a quantity above stock blocks the order and says by how much", async () => {
  const low = await product(LOW_STOCK);
  const quote = await quoteCart([{ i: LOW_STOCK, q: low.stock + 4 }]);

  assert.equal(quote.lines.length, 0);
  assert.deepEqual(quote.problems, [
    {
      kind: "over-stock",
      title: low.title,
      available: low.stock,
      requested: low.stock + 4,
    },
  ]);
});

test("quoteCart: good lines are still priced alongside a bad one", async () => {
  const good = await product(IN_STOCK);
  const quote = await quoteCart([
    { i: IN_STOCK, q: 2 },
    { i: OUT_OF_STOCK, q: 1 },
  ]);

  assert.equal(quote.lines.length, 1);
  assert.equal(quote.problems.length, 1);
  assert.equal(quote.subtotalPaise, 2 * good.pricePaise);
});

test("createOrder: writes the order, snapshots the lines, and clears the cart", async () => {
  const user = newUser();
  const a = await product(IN_STOCK);
  const b = await product(LOW_STOCK);

  await writeUserCart(user, [
    { i: a.id, q: 2 },
    { i: b.id, q: 1 },
  ]);
  const quote = await quoteCart(await readUserCart(user));

  const orderNumber = await createOrder({
    userId: user,
    email: "test@example.com",
    address: ADDRESS,
    payment: "demo_card",
    quote,
  });

  assert.match(orderNumber, /^BLZ-\d{6}-[A-Z2-9]{5}$/);

  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));
  assert.ok(order);
  assert.equal(order.userId, user);
  assert.equal(order.status, "placed");
  assert.equal(order.paymentMethod, "demo_card");
  assert.equal(order.city, ADDRESS.city);
  assert.equal(order.postalCode, ADDRESS.postalCode);
  assert.equal(order.addressLine2, null, "an empty optional line is stored as null");
  assert.equal(order.subtotalPaise, 2 * a.pricePaise + b.pricePaise);
  assert.equal(order.deliveryPaise, 0);
  assert.equal(order.totalPaise, order.subtotalPaise);

  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, order.id));
  assert.equal(items.length, 2);
  const itemA = items.find((i) => i.productId === a.id)!;
  assert.equal(itemA.title, a.title);
  assert.equal(itemA.slug, a.slug);
  assert.equal(itemA.thumbnail, a.thumbnail);
  assert.equal(itemA.quantity, 2);
  assert.equal(itemA.unitPricePaise, a.pricePaise);
  assert.equal(itemA.linePaise, 2 * a.pricePaise);

  assert.deepEqual(await readUserCart(user), [], "the cart is emptied by a successful order");
});

test("createOrder: the line snapshot survives a catalog price change", async () => {
  const user = newUser();
  const a = await product(IN_STOCK);
  await writeUserCart(user, [{ i: a.id, q: 1 }]);

  const orderNumber = await createOrder({
    userId: user,
    email: "test@example.com",
    address: ADDRESS,
    payment: "demo_cod",
    quote: await quoteCart(await readUserCart(user)),
  });
  const [order] = await db.select().from(orders).where(eq(orders.orderNumber, orderNumber));

  // Repriced inside a transaction that is rolled back, so the seeded catalog
  // is never left changed even if this test fails.
  class Rollback extends Error {}
  await db
    .transaction(async (tx) => {
      await tx
        .update(products)
        .set({ pricePaise: a.pricePaise + 500_00, title: "Renamed after the order" })
        .where(eq(products.id, a.id));

      const [item] = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
      assert.equal(item.unitPricePaise, a.pricePaise, "the order keeps what was paid");
      assert.equal(item.title, a.title, "the order keeps what was bought");
      throw new Rollback();
    })
    .catch((error) => {
      if (!(error instanceof Rollback)) throw error;
    });

  const after = await product(a.id);
  assert.equal(after.pricePaise, a.pricePaise, "the catalog is unchanged");
  assert.equal(after.title, a.title);
});

test("createOrder: each order gets its own number, and only its own cart is cleared", async () => {
  const buyer = newUser();
  const bystander = newUser();
  const a = await product(IN_STOCK);

  await writeUserCart(bystander, [{ i: a.id, q: 3 }]);

  const numbers: string[] = [];
  for (let i = 0; i < 2; i += 1) {
    await writeUserCart(buyer, [{ i: a.id, q: 1 }]);
    numbers.push(
      await createOrder({
        userId: buyer,
        email: "test@example.com",
        address: ADDRESS,
        payment: "demo_card",
        quote: await quoteCart(await readUserCart(buyer)),
      }),
    );
  }

  assert.notEqual(numbers[0], numbers[1]);
  const rows = await db
    .select({ n: orders.orderNumber })
    .from(orders)
    .where(inArray(orders.orderNumber, numbers));
  assert.equal(rows.length, 2, "both orders are stored");

  assert.deepEqual(await readUserCart(bystander), [{ i: a.id, q: 3 }], "another cart is untouched");
});
