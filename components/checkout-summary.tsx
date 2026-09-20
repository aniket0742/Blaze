import Image from "next/image";
import Link from "next/link";
import type { CheckoutQuote } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";

/**
 * What is being bought and what it costs. Every figure is computed on the
 * server from the catalog — this component only formats it.
 */
export function CheckoutSummary({ quote }: { quote: CheckoutQuote }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Order summary</h2>
        <Link href="/cart" className="text-[13px] font-medium text-brand-600 hover:underline">
          Edit cart
        </Link>
      </div>

      <ul className="mt-3 divide-y divide-border-subtle">
        {quote.lines.map((line) => (
          <li key={line.productId} className="flex gap-3 py-3">
            <Link
              href={`/product/${line.slug}`}
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-subtle bg-background"
            >
              <Image
                src={line.thumbnail}
                alt={line.title}
                fill
                sizes="56px"
                className="object-contain p-1"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link
                href={`/product/${line.slug}`}
                className="line-clamp-2 text-[13px] font-medium hover:underline"
              >
                {line.title}
              </Link>
              <p className="mt-0.5 text-[12px] text-muted">
                Qty {line.quantity} × {formatPrice(line.unitPricePaise)}
              </p>
            </div>
            <p className="shrink-0 text-[13px] font-semibold tabular-nums">
              {formatPrice(line.linePaise)}
            </p>
          </li>
        ))}
      </ul>

      <dl className="mt-3 space-y-2 border-t border-border-subtle pt-3 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">
            Subtotal ({quote.totalQty} {quote.totalQty === 1 ? "item" : "items"})
          </dt>
          <dd className="font-medium tabular-nums">{formatPrice(quote.subtotalPaise)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Delivery</dt>
          <dd className="font-medium text-emerald-700">
            {quote.deliveryPaise === 0 ? "Free" : formatPrice(quote.deliveryPaise)}
          </dd>
        </div>
        {quote.arrivesBy && (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Arrives</dt>
            <dd className="text-right font-medium">{quote.arrivesBy.replace(/^Arrives /, "")}</dd>
          </div>
        )}
        <div className="flex justify-between gap-3 border-t border-border-subtle pt-2.5 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(quote.totalPaise)}</dd>
        </div>
      </dl>

      <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>
    </div>
  );
}
