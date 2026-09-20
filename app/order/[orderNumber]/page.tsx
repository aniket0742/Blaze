import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderLines } from "@/components/order-lines";
import { OrderStatusBadge } from "@/components/order-status";
import { PAYMENT_LABELS, isPaymentMethod } from "@/lib/checkout";
import { formatOrderDate, formatPrice } from "@/lib/format";
import { arrivalText, type OrderDetailView } from "@/lib/orders";
import { getOrderDetail } from "@/lib/orders-server";
import { getUser } from "@/lib/supabase/server";

/** One scoped lookup shared by the title and the page, so the tab can never
 *  name an order this account does not own. */
const loadOrder = cache(async (orderNumber: string) => {
  const user = await getUser();
  if (!user) return { user: null, order: null };
  return { user, order: await getOrderDetail(orderNumber, user.id) };
});

export async function generateMetadata({
  params,
}: PageProps<"/order/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  const { order } = await loadOrder(orderNumber);
  return {
    title: order ? `Order ${order.orderNumber}` : "Order not found",
    robots: { index: false },
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">{children}</div>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

function Totals({ order }: { order: OrderDetailView }) {
  return (
    <Panel title="Order summary">
      <dl className="mt-2.5 space-y-2 text-sm">
        <Row
          label={`Subtotal (${order.units} ${order.units === 1 ? "item" : "items"})`}
          value={<span className="tabular-nums">{formatPrice(order.subtotalPaise)}</span>}
        />
        <Row
          label="Delivery"
          value={
            order.deliveryPaise === 0 ? (
              <span className="text-emerald-700">Free</span>
            ) : (
              <span className="tabular-nums">{formatPrice(order.deliveryPaise)}</span>
            )
          }
        />
        <div className="flex justify-between gap-3 border-t border-border-subtle pt-2.5 text-base">
          <dt className="font-semibold">Total paid</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(order.totalPaise)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>
    </Panel>
  );
}

function Shipping({ order }: { order: OrderDetailView }) {
  const arrives = arrivalText(order.arrivesBy);
  const payment = isPaymentMethod(order.paymentMethod)
    ? PAYMENT_LABELS[order.paymentMethod]
    : order.paymentMethod;

  return (
    <Panel title="Delivery">
      <address className="mt-2.5 text-[13px] not-italic">
        <span className="block font-medium">{order.fullName}</span>
        <span className="block text-muted">{order.addressLine1}</span>
        {order.addressLine2 && <span className="block text-muted">{order.addressLine2}</span>}
        <span className="block text-muted">
          {order.city}, {order.state} {order.postalCode}
        </span>
        <span className="block text-muted">{order.phone}</span>
      </address>

      <dl className="mt-3 space-y-2 border-t border-border-subtle pt-3 text-[13px]">
        {arrives && <Row label="Arriving" value={arrives} />}
        <Row label="Payment" value={payment} />
      </dl>
    </Panel>
  );
}

/**
 * Order details, rendered entirely from the snapshot stored at purchase. The
 * catalog is never consulted: a product that has since been repriced, renamed
 * or removed does not change a single figure on this page.
 */
export default async function OrderDetailPage({ params }: PageProps<"/order/[orderNumber]">) {
  const { orderNumber } = await params;
  const user = await getUser();
  if (!user) redirect(`/signin?returnTo=${encodeURIComponent(`/order/${orderNumber}`)}`);

  const { order } = await loadOrder(orderNumber);

  // One response for "no such order", "not yours" and "not an order number".
  // Telling them apart would confirm that an order number exists.
  if (!order) {
    return (
      <Shell>
        <h1 className="sr-only">Order not found</h1>
        <EmptyState
          title="We couldn't find that order"
          description="There is no order with that number on your account. Check the link, or see all your orders."
          actionHref="/orders"
          actionLabel="Your orders"
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        href="/orders"
        className="text-[13px] font-medium text-brand-600 hover:underline"
      >
        ← Your orders
      </Link>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Order details</h1>
          <p className="mt-1 text-[13px] text-muted">
            Placed {formatOrderDate(order.placedAt)}
          </p>
        </div>
        <div className="sm:text-right">
          <p className="text-[11px] uppercase tracking-wide text-muted">Order number</p>
          <p className="font-mono text-base font-semibold tracking-wide">{order.orderNumber}</p>
        </div>
      </header>

      <div className="mt-3">
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-5 lg:grid lg:grid-cols-[1fr_320px] lg:items-start lg:gap-6">
        <div>
          <h2 className="sr-only">Items in this order</h2>
          <OrderLines lines={order.lines} />
          <p className="mt-2 px-1 text-[12px] text-muted">
            Prices are what you paid when you placed this order, not today&apos;s prices.
          </p>
        </div>

        <div className="mt-4 space-y-4 lg:mt-0">
          <Totals order={order} />
          <Shipping order={order} />
        </div>
      </div>

      <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
        <strong className="font-semibold">Demo order.</strong> Nothing was charged and nothing
        will be shipped. Blaze is a portfolio storefront.
      </p>
    </Shell>
  );
}
