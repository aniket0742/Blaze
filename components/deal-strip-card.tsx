import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { deliveryEstimate, discountLabel, formatPrice } from "@/lib/format";

/**
 * Horizontal deal card. Short by design — these stack two or three deep beside
 * the deals module instead of one tall card stretching to match its height.
 */
export function DealStripCard({ product }: { product: Product }) {
  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full items-center gap-3 rounded-2xl border border-border-subtle bg-background p-3 shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-square w-[38%] max-w-[120px] shrink-0 overflow-hidden rounded-lg bg-surface">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="120px"
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug">{product.title}</h3>
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
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
        <p className="text-[11px] text-muted">{deliveryEstimate(product.shippingInformation)}</p>
      </div>
    </Link>
  );
}
