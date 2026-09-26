import Image from "next/image";
import Link from "next/link";
import { arrivalText, orderPath, type OrderSummaryView } from "@/lib/orders";
import { formatOrderDate, formatPrice } from "@/lib/format";
import { ArrowIcon } from "./icons";
import { OrderStatusBadge } from "./order-status";

const PREVIEW = 4;

/** Summarises what was bought without repeating the whole order. */
function itemSummary(order: OrderSummaryView): string {
  const [first, ...rest] = order.lines;
  if (!first) return `${order.units} items`;
  if (rest.length === 0) return first.title;
  return `${first.title} and ${rest.length} more ${rest.length === 1 ? "item" : "items"}`;
}

/** One order in the history, set like a torn-off ticket. */
export function OrderCard({ order }: { order: OrderSummaryView }) {
  const preview = order.lines.slice(0, PREVIEW);
  const hidden = order.lines.length - preview.length;
  // Only orders placed before the Open Food Facts migration carry a promised date.
  const arrives = arrivalText(order.arrivesBy);

  return (
    <li className="receipt px-5 pt-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div>
          <p className="font-mono text-[15px] font-semibold tracking-wider">{order.orderNumber}</p>
          <p className="mt-1 text-[13px] text-muted">
            Placed {formatOrderDate(order.placedAt)} · shipping to {order.city}, {order.state}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-dashed border-border-field pt-4">
        {preview.map((line) => (
          <div key={line.id} className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-surface">
            <Image src={line.thumbnail} alt="" fill sizes="56px" className="object-contain p-1.5 mix-blend-multiply" />
          </div>
        ))}
        {hidden > 0 && <span className="px-1 font-mono text-[13px] text-muted">+{hidden}</span>}
        <p className="ml-2 min-w-0 flex-1 basis-48 text-[14px] leading-snug">{itemSummary(order)}</p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-dashed border-border-field pt-4">
        <p className="text-[13px] text-muted">
          {order.units} {order.units === 1 ? "item" : "items"}
          {arrives && ` · arriving ${arrives}`}
          {" · "}
          <span className="font-mono font-semibold text-foreground">{formatPrice(order.totalPaise)}</span>
        </p>
        <Link
          href={orderPath(order.orderNumber)}
          className="inline-flex items-center gap-1.5 text-sm font-medium underline decoration-border-field underline-offset-4 hover:decoration-foreground"
        >
          View order details
          <ArrowIcon />
        </Link>
      </div>
    </li>
  );
}
