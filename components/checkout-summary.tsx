import Image from "next/image";
import Link from "next/link";
import type { CheckoutQuote } from "@/lib/checkout";
import { formatPrice } from "@/lib/format";
import { Receipt, ReceiptRow } from "./ui";

/**
 * What is being bought and what it costs, printed as a receipt. Every figure
 * is computed on the server from the catalog — this component only formats it.
 */
export function CheckoutSummary({ quote }: { quote: CheckoutQuote }) {
  return (
    <Receipt>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">Order summary</h2>
        <Link href="/cart" className="text-[13px] font-medium underline decoration-border-field underline-offset-2 hover:decoration-foreground">
          Edit bag
        </Link>
      </div>

      <ul className="mt-4 space-y-3 border-t border-dashed border-border-field pt-4">
        {quote.lines.map((line) => (
          <li key={line.productId} className="flex gap-3">
            <Link
              href={`/product/${line.slug}`}
              className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-surface"
            >
              <Image src={line.thumbnail} alt={line.title} fill sizes="48px" className="object-contain p-1 mix-blend-multiply" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${line.slug}`} className="line-clamp-2 text-[13px] font-medium leading-snug hover:underline">
                {line.title}
              </Link>
              <p className="mt-0.5 font-mono text-[12px] text-muted">
                {line.quantity} × {formatPrice(line.unitPricePaise)}
              </p>
            </div>
            <p className="shrink-0 font-mono text-[13px] tabular-nums">{formatPrice(line.linePaise)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-dashed border-border-field pt-4">
        <ReceiptRow
          label={`Subtotal, ${quote.totalQty} ${quote.totalQty === 1 ? "item" : "items"}`}
          value={formatPrice(quote.subtotalPaise)}
        />
        <ReceiptRow label="Delivery" value={quote.deliveryPaise === 0 ? "Free" : formatPrice(quote.deliveryPaise)} />
      </dl>
      <dl className="mt-4 border-t border-dashed border-border-field pt-4">
        <ReceiptRow label="Total" value={formatPrice(quote.totalPaise)} strong />
      </dl>
      <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>
    </Receipt>
  );
}
