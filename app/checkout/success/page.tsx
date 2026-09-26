import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { EmptyState } from "@/components/empty-state";
import { FlameMark } from "@/components/icons";
import { Receipt, ReceiptRow, button } from "@/components/ui";
import { PAYMENT_LABELS, isPaymentMethod } from "@/lib/checkout";
import { formatOrderDate, formatPrice } from "@/lib/format";
import { arrivalText, orderPath } from "@/lib/orders";
import { getOrderDetail } from "@/lib/orders-server";
import { getUser } from "@/lib/supabase/server";

/** One lookup shared by the title and the page, so the tab never says an order
 *  was placed unless this account owns that order. */
const loadOrder = cache(async (orderNumber: string) => {
  const user = await getUser();
  const order = user && orderNumber ? await getOrderDetail(orderNumber, user.id) : null;
  return { user, order };
});

function orderNumberFrom(raw: string | string[] | undefined): string {
  return typeof raw === "string" ? raw : "";
}

export async function generateMetadata({ searchParams }: PageProps<"/checkout/success">): Promise<Metadata> {
  const { order } = await loadOrder(orderNumberFrom((await searchParams).order));
  return { title: order ? "Order placed" : "Order not found", robots: { index: false } };
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">{children}</div>;
}

/**
 * The confirmation, printed as a receipt. It is a read of the order that was
 * just written, through the same owner-scoped lookup the order pages use, so a
 * forwarded link shows nothing to anyone else. The full record lives at
 * /order/[orderNumber], which it links to.
 */
export default async function CheckoutSuccessPage({ searchParams }: PageProps<"/checkout/success">) {
  const { user, order } = await loadOrder(orderNumberFrom((await searchParams).order));

  if (!order) {
    return (
      <Shell>
        <h1 className="sr-only">Order not found</h1>
        <EmptyState
          title="We couldn't find that order"
          description="There is no order with that number on your account. Check the link, or keep shopping."
          actionHref="/orders"
          actionLabel="Your orders"
          secondaryHref="/#aisles"
          secondaryLabel="Browse the aisles"
        />
      </Shell>
    );
  }

  const payment = isPaymentMethod(order.paymentMethod) ? PAYMENT_LABELS[order.paymentMethod] : order.paymentMethod;
  // Only orders placed before the Open Food Facts migration carry a promised date.
  const arrives = arrivalText(order.arrivesBy);

  return (
    <Shell>
      <div className="text-center">
        <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-foreground text-page">
          <FlameMark className="h-6 w-6 text-brand-400" />
        </span>
        <h1 className="mt-4 font-display text-5xl tracking-tight">Order placed</h1>
        <p className="mt-3 text-[15px] text-muted">
          Thanks, {order.fullName.split(" ")[0]}. A confirmation would normally reach{" "}
          <span className="font-medium text-foreground">{user?.email}</span>.
        </p>
      </div>

      <Receipt className="mt-8">
        <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-muted">Blaze · receipt</p>
        <div className="mt-4 border-t border-dashed border-border-field pt-4 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Order number</p>
          <p className="mt-1 font-mono text-xl font-semibold tracking-wider">{order.orderNumber}</p>
          <p className="mt-1 font-mono text-[12px] text-muted">{formatOrderDate(order.placedAt)}</p>
        </div>
        <dl className="mt-4 space-y-2 border-t border-dashed border-border-field pt-4">
          <ReceiptRow label={`Items`} value={`${order.units}`} />
          <ReceiptRow label="Payment" value={payment} />
          {arrives && <ReceiptRow label="Delivery" value={arrives} />}
          <ReceiptRow label="Shipping to" value={`${order.city}, ${order.state} ${order.postalCode}`} />
        </dl>
        <dl className="mt-4 border-t border-dashed border-border-field pt-4">
          <ReceiptRow label="Total paid" value={formatPrice(order.totalPaise)} strong />
        </dl>
        <p className="mt-4 rounded-md border-l-4 border-amber-600 bg-amber-50 px-3 py-2 text-[13px] text-amber-900">
          <strong className="font-semibold">Demo order.</strong> Nothing was charged and nothing will be shipped.
          Blaze is a portfolio storefront.
        </p>
      </Receipt>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href={orderPath(order.orderNumber)} className={button("primary", "lg")}>
          View order details
        </Link>
        <Link href="/#aisles" className={button("secondary", "lg")}>
          Keep shopping
        </Link>
      </div>
    </Shell>
  );
}
