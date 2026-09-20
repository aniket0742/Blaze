import Image from "next/image";
import Link from "next/link";
import { arrivalText, orderPath, type OrderSummaryView } from "@/lib/orders";
import { formatOrderDate, formatPrice } from "@/lib/format";
import { OrderStatusBadge } from "./order-status";

const PREVIEW = 4;

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] uppercase tracking-wide text-muted">{label}</dt>
      <dd className="truncate text-[13px] font-medium">{value}</dd>
    </div>
  );
}

/** Summarises what was bought without repeating the whole order. */
function itemSummary(order: OrderSummaryView): string {
  const [first, ...rest] = order.lines;
  if (!first) return `${order.units} items`;
  if (rest.length === 0) return first.title;
  return `${first.title} and ${rest.length} more ${rest.length === 1 ? "item" : "items"}`;
}

export function OrderCard({ order }: { order: OrderSummaryView }) {
  const preview = order.lines.slice(0, PREVIEW);
  const hidden = order.lines.length - preview.length;
  const arrives = arrivalText(order.arrivesBy);
  const href = orderPath(order.orderNumber);

  return (
    <li className="overflow-hidden rounded-2xl border border-border-subtle bg-background shadow-card">
      <dl className="flex flex-wrap justify-between gap-x-6 gap-y-3 border-b border-border-subtle bg-surface px-4 py-3 sm:px-5">
        <Meta label="Order placed" value={formatOrderDate(order.placedAt)} />
        <Meta label="Total" value={formatPrice(order.totalPaise)} />
        <Meta label="Ship to" value={`${order.city}, ${order.state}`} />
        <div className="min-w-0">
          <dt className="text-[11px] uppercase tracking-wide text-muted">Order number</dt>
          <dd className="truncate font-mono text-[13px] font-semibold">{order.orderNumber}</dd>
        </div>
      </dl>

      <div className="px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <OrderStatusBadge status={order.status} />
          {arrives && <p className="text-[13px] text-muted">Arriving {arrives}</p>}
        </div>

        <div className="mt-3 flex items-center gap-2">
          {preview.map((line) => (
            <div
              key={line.id}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-background"
            >
              <Image
                src={line.thumbnail}
                alt=""
                fill
                sizes="56px"
                className="object-contain p-1"
              />
            </div>
          ))}
          {hidden > 0 && (
            <span className="text-[13px] font-medium text-muted">+{hidden} more</span>
          )}
        </div>

        <p className="mt-3 line-clamp-2 text-sm">{itemSummary(order)}</p>

        <Link
          href={href}
          className="mt-3 inline-flex rounded-full border border-border-subtle px-4 py-2 text-[13px] font-medium transition-colors hover:bg-surface"
        >
          View order details
        </Link>
      </div>
    </li>
  );
}
