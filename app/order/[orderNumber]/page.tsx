import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { cache } from "react";
import { EmptyState } from "@/components/empty-state";
import { OrderLines } from "@/components/order-lines";
import { OrderStatusBadge } from "@/components/order-status";
import { PageTitle, Receipt, ReceiptRow } from "@/components/ui";
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

export async function generateMetadata({ params }: PageProps<"/order/[orderNumber]">): Promise<Metadata> {
  const { orderNumber } = await params;
  const { order } = await loadOrder(orderNumber);
  return {
    title: order ? `Order ${order.orderNumber}` : "Order not found",
    robots: { index: false },
  };
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">{children}</div>;
}

function Totals({ order }: { order: OrderDetailView }) {
  const payment = isPaymentMethod(order.paymentMethod) ? PAYMENT_LABELS[order.paymentMethod] : order.paymentMethod;
  // Only orders placed before the Open Food Facts migration carry a promised date.
  const arrives = arrivalText(order.arrivesBy);
  return (
    <Receipt>
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-muted">Blaze · receipt</p>
      <dl className="mt-4 space-y-2 border-t border-dashed border-border-field pt-4">
        <ReceiptRow
          label={`Subtotal, ${order.units} ${order.units === 1 ? "item" : "items"}`}
          value={formatPrice(order.subtotalPaise)}
        />
        <ReceiptRow
          label="Delivery"
          value={order.deliveryPaise === 0 ? "Free" : formatPrice(order.deliveryPaise)}
        />
      </dl>
      <dl className="mt-4 border-t border-dashed border-border-field pt-4">
        <ReceiptRow label="Total paid" value={formatPrice(order.totalPaise)} strong />
      </dl>
      <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>

      <div className="mt-5 border-t border-dashed border-border-field pt-4">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Delivering to</h2>
        <address className="mt-2 text-[14px] not-italic leading-relaxed">
          <span className="block font-medium">{order.fullName}</span>
          <span className="block text-muted">{order.addressLine1}</span>
          {order.addressLine2 && <span className="block text-muted">{order.addressLine2}</span>}
          <span className="block text-muted">
            {order.city}, {order.state} {order.postalCode}
          </span>
          <span className="block text-muted">{order.phone}</span>
        </address>
        <dl className="mt-3 space-y-2">
          {arrives && <ReceiptRow label="Arriving" value={arrives} />}
          <ReceiptRow label="Payment" value={payment} />
        </dl>
      </div>
    </Receipt>
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
        <div className="mx-auto max-w-2xl">
          <EmptyState
            title="We couldn't find that order"
            description="There is no order with that number on your account. Check the link, or see all your orders."
            actionHref="/orders"
            actionLabel="Your orders"
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Link
        href="/orders"
        className="text-[13px] font-medium underline decoration-border-field underline-offset-4 hover:decoration-foreground"
      >
        ← Your orders
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-foreground pb-6">
        <PageTitle eyebrow={`Placed ${formatOrderDate(order.placedAt)}`} title="Order details">
          <p>
            Order <span className="font-mono font-semibold text-foreground">{order.orderNumber}</span>
          </p>
        </PageTitle>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-8 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-12">
        <div>
          <h2 className="sr-only">Items in this order</h2>
          <OrderLines lines={order.lines} />
          <p className="mt-3 text-[13px] text-muted">
            Prices are what you paid when you placed this order, not today&apos;s prices.
          </p>
        </div>

        <div className="mt-10 lg:mt-0">
          <Totals order={order} />
        </div>
      </div>

      <p className="mt-10 max-w-3xl rounded-md border-l-4 border-amber-600 bg-amber-50 px-4 py-3 text-[14px] text-amber-900">
        <strong className="font-semibold">Demo order.</strong> Nothing was charged and nothing will be shipped. Blaze
        is a portfolio storefront.
      </p>
    </Shell>
  );
}
