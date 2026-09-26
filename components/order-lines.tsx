import Image from "next/image";
import Link from "next/link";
import type { OrderLineView } from "@/lib/orders";
import { formatPrice } from "@/lib/format";

/**
 * The items of a placed order. Every value here is the snapshot taken at
 * purchase — the catalog is not consulted, so a repriced or deleted product
 * changes nothing on this page.
 *
 * `productId` is the one field that affects rendering: it survives only while
 * the product does, so it decides whether the title is a link.
 */
function Line({ line }: { line: OrderLineView }) {
  const stillSold = line.productId !== null;

  return (
    <li className="flex gap-4 py-5">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-surface">
        <Image src={line.thumbnail} alt="" fill sizes="80px" className="object-contain p-2 mix-blend-multiply" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {line.brand && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{line.brand}</p>
        )}
        {stillSold ? (
          <Link
            href={`/product/${line.slug}`}
            className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug hover:underline hover:underline-offset-2"
          >
            {line.title}
          </Link>
        ) : (
          <p className="mt-0.5 line-clamp-2 text-[15px] font-medium leading-snug">{line.title}</p>
        )}
        <p className="mt-1 font-mono text-[12px] text-muted">
          {line.quantity} × {formatPrice(line.unitPricePaise)}
        </p>
        {!stillSold && <p className="mt-1 text-[12px] text-muted">No longer sold on Blaze.</p>}
      </div>

      <p className="shrink-0 font-mono text-[15px] font-semibold tabular-nums">{formatPrice(line.linePaise)}</p>
    </li>
  );
}

export function OrderLines({ lines }: { lines: OrderLineView[] }) {
  return (
    <ul className="divide-y divide-border-subtle border-y border-border-subtle">
      {lines.map((line) => (
        <Line key={line.id} line={line} />
      ))}
    </ul>
  );
}
