import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { NutriscoreChip } from "./nutriscore-badge";
import { Price } from "./ui";

/**
 * "Most scanned" as a ranking rather than a carousel: a numbered list, the way
 * a magazine prints a chart. The order is Open Food Facts' own scan count.
 */
export function RankedList({ products }: { products: Product[] }) {
  return (
    <ol className="grid gap-x-10 sm:grid-cols-2">
      {products.map((p, i) => (
        <li key={p.id} className="border-b border-border-subtle">
          <Link href={`/product/${p.slug}`} className="group flex items-center gap-4 py-4">
            <span aria-hidden className="w-10 shrink-0 font-display text-4xl leading-none text-muted/70 tabular-nums">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-surface">
              <Image src={p.thumbnail} alt="" fill sizes="64px" className="object-contain p-1.5 mix-blend-multiply" />
            </div>
            <div className="min-w-0 flex-1">
              {p.brand && (
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">{p.brand}</p>
              )}
              <p className="line-clamp-2 text-[14px] font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
                <span className="sr-only">Number {i + 1}: </span>
                {p.title}
              </p>
              <div className="mt-1">
                <Price pricePaise={p.pricePaise} mrpPaise={p.mrpPaise} size="sm" saving={false} />
              </div>
            </div>
            <NutriscoreChip grade={p.nutriscoreGrade} />
          </Link>
        </li>
      ))}
    </ol>
  );
}
