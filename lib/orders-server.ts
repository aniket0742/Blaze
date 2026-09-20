/**
 * Every read of an order in Blaze goes through this file, and every query in
 * it carries the signed-in user's id in its WHERE clause. That is the whole
 * ownership model: there is no code path that fetches an order by number
 * alone and checks the owner afterwards, so there is nothing to forget.
 *
 * Reads are pure snapshot reads. `products` is never joined — an order has to
 * render what was bought at what was paid, whatever the catalog says now, and
 * whether or not the product still exists.
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import { orderItems, orders } from "./db/schema";
import {
  isOrderNumberShaped,
  orderUnits,
  type OrderDetailView,
  type OrderLineView,
  type OrderSummaryView,
} from "./orders";

type LineRow = typeof orderItems.$inferSelect;

function toLine(row: LineRow): OrderLineView {
  return {
    id: row.id,
    productId: row.productId,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    thumbnail: row.thumbnail,
    unitPricePaise: row.unitPricePaise,
    quantity: row.quantity,
    linePaise: row.linePaise,
  };
}

/**
 * One account's orders, newest first. Two queries rather than a join: a join
 * would repeat every order column per line, and grouping in JavaScript over a
 * handful of orders is cheaper to read than to optimise.
 */
export async function listOrders(userId: string): Promise<OrderSummaryView[]> {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.userId, userId))
    // id breaks ties, so two orders placed in the same millisecond still have
    // a stable order between renders.
    .orderBy(desc(orders.placedAt), desc(orders.id));
  if (rows.length === 0) return [];

  const lines = await db
    .select()
    .from(orderItems)
    .where(
      inArray(
        orderItems.orderId,
        rows.map((r) => r.id),
      ),
    )
    .orderBy(orderItems.id);

  const byOrder = new Map<number, OrderLineView[]>();
  for (const line of lines) {
    const list = byOrder.get(line.orderId);
    if (list) list.push(toLine(line));
    else byOrder.set(line.orderId, [toLine(line)]);
  }

  return rows.map((order) => {
    const orderLines = byOrder.get(order.id) ?? [];
    return {
      orderNumber: order.orderNumber,
      placedAt: order.placedAt,
      status: order.status,
      totalPaise: order.totalPaise,
      arrivesBy: order.arrivesBy,
      city: order.city,
      state: order.state,
      units: orderUnits(orderLines),
      lines: orderLines,
    };
  });
}

/**
 * One order, or null. Null covers all three of "no such order", "not yours"
 * and "not an order number" — the caller cannot tell them apart, and neither
 * can anyone probing the URL.
 */
export async function getOrderDetail(
  orderNumber: string,
  userId: string,
): Promise<OrderDetailView | null> {
  if (!isOrderNumberShaped(orderNumber)) return null;

  const [order] = await db
    .select()
    .from(orders)
    .where(and(eq(orders.orderNumber, orderNumber), eq(orders.userId, userId)))
    .limit(1);
  if (!order) return null;

  const lines = (
    await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).orderBy(orderItems.id)
  ).map(toLine);

  return {
    orderNumber: order.orderNumber,
    placedAt: order.placedAt,
    status: order.status,
    totalPaise: order.totalPaise,
    arrivesBy: order.arrivesBy,
    city: order.city,
    state: order.state,
    units: orderUnits(lines),
    lines,
    email: order.email,
    fullName: order.fullName,
    phone: order.phone,
    addressLine1: order.addressLine1,
    addressLine2: order.addressLine2,
    postalCode: order.postalCode,
    paymentMethod: order.paymentMethod,
    subtotalPaise: order.subtotalPaise,
    deliveryPaise: order.deliveryPaise,
  };
}
