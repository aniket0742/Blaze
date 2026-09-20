import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { EmptyState } from "@/components/empty-state";
import { PAYMENT_LABELS, isPaymentMethod } from "@/lib/checkout";
import { getOwnOrder } from "@/lib/checkout-server";
import { formatPrice } from "@/lib/format";
import { getUser } from "@/lib/supabase/server";

/** One lookup shared by the title and the page, so the tab never says an order
 *  was placed unless this account owns that order. */
const loadOrder = cache(async (orderNumber: string) => {
  const user = await getUser();
  const order = user && orderNumber ? await getOwnOrder(orderNumber, user.id) : null;
  return { user, order };
});

function orderNumberFrom(raw: string | string[] | undefined): string {
  return typeof raw === "string" ? raw : "";
}

export async function generateMetadata({
  searchParams,
}: PageProps<"/checkout/success">): Promise<Metadata> {
  const { order } = await loadOrder(orderNumberFrom((await searchParams).order));
  return { title: order ? "Order placed" : "Order not found", robots: { index: false } };
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">{children}</div>;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4 gap-y-0.5 border-t border-border-subtle py-2.5 first:border-t-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium">{value}</dd>
    </div>
  );
}

/**
 * The confirmation. It is a read of the order that was just written, scoped
 * to its owner, so a forwarded link shows nothing to anyone else. Order
 * history and order details are a later milestone; this page is the last
 * step of checkout, not the first step of that.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: PageProps<"/checkout/success">) {
  const { user, order } = await loadOrder(orderNumberFrom((await searchParams).order));

  if (!order) {
    return (
      <Shell>
        <h1 className="sr-only">Order not found</h1>
        <EmptyState
          title="We couldn't find that order"
          description="There is no order with that number on your account. Check the link, or continue shopping."
          actionHref="/search"
          actionLabel="Continue shopping"
        />
      </Shell>
    );
  }

  const payment = isPaymentMethod(order.paymentMethod)
    ? PAYMENT_LABELS[order.paymentMethod]
    : order.paymentMethod;

  return (
    <Shell>
      <div className="text-center">
        <span
          aria-hidden
          className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700"
        >
          ✓
        </span>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Order placed</h1>
        <p className="mt-2 text-sm text-muted">
          Thanks, {order.fullName.split(" ")[0]}. A confirmation would normally reach{" "}
          <span className="font-medium text-foreground">{user?.email}</span>.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-[13px] text-muted">Order number</p>
          <p className="font-mono text-base font-semibold tracking-wide">{order.orderNumber}</p>
        </div>

        <dl className="mt-3 border-t border-border-subtle pt-1">
          <Row
            label="Items"
            value={`${order.units} ${order.units === 1 ? "item" : "items"}`}
          />
          <Row label="Total" value={<span className="tabular-nums">{formatPrice(order.totalPaise)}</span>} />
          <Row label="Payment" value={payment} />
          {order.arrivesBy && <Row label="Delivery" value={order.arrivesBy.replace(/^Arrives /, "")} />}
          <Row
            label="Shipping to"
            value={`${order.city}, ${order.state} ${order.postalCode}`}
          />
        </dl>

        <p className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <strong className="font-semibold">Demo order.</strong> Nothing was charged and nothing
          will be shipped. Blaze is a portfolio storefront.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/search"
          className="rounded-full bg-brand-600 px-5 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-brand-700"
        >
          Continue shopping
        </Link>
        <Link
          href="/"
          className="rounded-full border border-border-subtle px-5 py-2.5 text-center text-sm font-medium transition-colors hover:bg-surface"
        >
          Back to home
        </Link>
      </div>
    </Shell>
  );
}
