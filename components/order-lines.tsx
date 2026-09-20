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
    <li className="flex gap-3 py-4 sm:gap-4">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border-subtle bg-background sm:h-20 sm:w-20">
        <Image
          src={line.thumbnail}
          alt=""
          fill
          sizes="80px"
          className="object-contain p-1.5"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted">
          {line.brand ?? "Blaze Marketplace"}
        </p>

        {stillSold ? (
          <Link
            href={`/product/${line.slug}`}
            className="line-clamp-2 text-sm font-medium hover:underline"
          >
            {line.title}
          </Link>
        ) : (
          <p className="line-clamp-2 text-sm font-medium">{line.title}</p>
        )}

        <p className="text-[13px] text-muted">
          Qty {line.quantity} × {formatPrice(line.unitPricePaise)}
        </p>

        {!stillSold && (
          <p className="text-[12px] text-muted">No longer sold on Blaze.</p>
        )}
      </div>

      <p className="shrink-0 text-sm font-semibold tabular-nums">{formatPrice(line.linePaise)}</p>
    </li>
  );
}

export function OrderLines({ lines }: { lines: OrderLineView[] }) {
  return (
    <div className="rounded-2xl border border-border-subtle bg-background px-4 shadow-card sm:px-5">
      <ul className="divide-y divide-border-subtle">
        {lines.map((line) => (
          <Line key={line.id} line={line} />
        ))}
      </ul>
    </div>
  );
}
