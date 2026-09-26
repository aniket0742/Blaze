import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { discountPercent } from "@/lib/format";
import { NutriscoreChip } from "./nutriscore-badge";
import { Price } from "./ui";

/**
 * A product as a specimen: the pack photographed on a paper-toned well, with
 * its Nutri-Score and any real saving pinned to the corners, and the facts set
 * underneath. Everything shown comes from Open Food Facts or Open Prices.
 */
export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.pricePaise, product.mrpPaise);

  return (
    <Link href={`/product/${product.slug}`} className="group flex h-full flex-col">
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-surface">
        {/* multiply lets a pack shot's white backdrop take on the paper tone. */}
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px"
          className="object-contain p-5 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-x-2.5 top-2.5 flex items-start justify-between">
          <NutriscoreChip grade={product.nutriscoreGrade} />
          {off >= 1 && (
            <span className="rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-brand-600">
              −{off}%
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col">
        {/* No brand in Open Food Facts means unknown, not unbranded — so say nothing. */}
        {product.brand && (
          <p className="truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            {product.brand}
          </p>
        )}
        <h3 className="mt-0.5 line-clamp-2 text-[14px] font-medium leading-snug group-hover:underline group-hover:decoration-border-field group-hover:underline-offset-2">
          {product.title}
        </h3>
        {product.quantity && <p className="mt-0.5 text-[12px] text-muted">{product.quantity}</p>}
        <div className="mt-auto pt-2">
          <Price pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} size="sm" saving={false} />
        </div>
      </div>
    </Link>
  );
}
