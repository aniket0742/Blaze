import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { deliveryEstimate, discountLabel, formatPrice } from "@/lib/format";

/**
 * Vertical deal card for the home band's 2×2. The image takes every pixel the
 * slot leaves over (`flex-1`) rather than a fixed aspect ratio, so it fills
 * whatever height the row ends up being.
 */
export function DealCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col rounded-2xl border border-border-subtle bg-background p-3 shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-lg bg-surface">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 90vw, 300px"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="mt-2.5 shrink-0">
        <h3 className="line-clamp-1 text-[13px] font-medium leading-snug">{product.title}</h3>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="text-base font-semibold tracking-tight">
            {formatPrice(product.pricePaise)}
          </span>
          <span className="text-[11px] text-muted line-through">
            {formatPrice(product.mrpPaise)}
          </span>
          <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {discountLabel(product.discountPercentage)}
          </span>
        </div>
        <p className="mt-0.5 text-[11px] text-muted">
          {deliveryEstimate(product.shippingInformation)}
        </p>
      </div>
    </Link>
  );
}
