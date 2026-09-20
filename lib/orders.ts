/**
 * Pure order-history types and helpers. No `next/headers` and no database
 * import, so pages, client components and the unit tests share one set of
 * definitions — same split as lib/cart.ts and lib/checkout.ts.
 *
 * Everything an order page renders comes from these snapshot shapes. There is
 * deliberately no product type in here: an order must render whether or not
 * the thing that was bought still exists in the catalog.
 */

/** One line of a placed order, exactly as `order_items` stored it. Prices are
 *  what was paid, never what the catalog charges today. */
export type OrderLineView = {
  id: number;
  /** Null once the product leaves the catalog. Only controls whether the
   *  title links out — the rest of the line is self-sufficient. */
  productId: number | null;
  slug: string;
  title: string;
  brand: string | null;
  thumbnail: string;
  unitPricePaise: number;
  quantity: number;
  linePaise: number;
};

/** What the list at /orders needs per order. */
export type OrderSummaryView = {
  orderNumber: string;
  placedAt: Date;
  status: string;
  totalPaise: number;
  arrivesBy: string | null;
  city: string;
  state: string;
  units: number;
  lines: OrderLineView[];
};

/** Everything /order/[orderNumber] shows, all of it snapshotted at purchase. */
export type OrderDetailView = OrderSummaryView & {
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string | null;
  postalCode: string;
  paymentMethod: string;
  subtotalPaise: number;
  deliveryPaise: number;
};

export type OrderStatusBadge = { label: string; className: string };

/** Only one status exists today. The fallback is defensive, not speculative:
 *  it keeps an unrecognised value readable instead of rendering nothing. */
const STATUSES: Record<string, OrderStatusBadge> = {
  placed: {
    label: "Order placed",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
};

export function orderStatus(raw: string): OrderStatusBadge {
  return STATUSES[raw] ?? { label: raw, className: "border-border-subtle bg-surface text-muted" };
}

/**
 * Bounds what reaches the database from a URL segment. Deliberately looser
 * than `generateOrderNumber`'s exact format, so changing that format later
 * cannot make older orders unreachable — the unique index does the real
 * lookup, and the query is scoped to the signed-in user either way.
 */
export function isOrderNumberShaped(raw: unknown): raw is string {
  return typeof raw === "string" && /^[A-Za-z0-9-]{1,32}$/.test(raw);
}

export function orderUnits(lines: { quantity: number }[]): number {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function orderPath(orderNumber: string): string {
  return `/order/${encodeURIComponent(orderNumber)}`;
}

/** "Arrives Tue, 23 Sep" is stored whole; the pages label the row themselves. */
export function arrivalText(arrivesBy: string | null): string | null {
  return arrivesBy ? arrivesBy.replace(/^Arrives /, "") : null;
}
