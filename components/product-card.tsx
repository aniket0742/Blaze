import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { deliveryEstimate, discountLabel, formatPrice } from "@/lib/format";
import { RatingStars } from "./rating-stars";
import { StockBadge } from "./stock-badge";

/**
 * Deliberately information-dense: price, rating, delivery date and stock are
 * all decision-making information and stay on the card. See DECISIONS.md.
 */
export function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discountPercentage >= 1;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-background shadow-card transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-square bg-surface">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 200px"
          className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute left-2 top-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {discountLabel(product.discountPercentage)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
          {product.brand ?? "Blaze Marketplace"}
        </p>
        <h3 className="line-clamp-2 text-[13px] font-medium leading-snug">{product.title}</h3>

        <div className="flex items-center gap-1 text-[11px] text-muted">
          <RatingStars rating={product.rating} className="text-xs" />
          <span>{product.rating.toFixed(1)}</span>
          <span aria-hidden>·</span>
          <span>{product.reviewCount}</span>
        </div>

        <div className="flex flex-wrap items-baseline gap-x-1.5">
          <span className="text-base font-semibold tracking-tight">
            {formatPrice(product.pricePaise)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-muted line-through">
              {formatPrice(product.mrpPaise)}
            </span>
          )}
        </div>

        <p className="text-[11px] text-muted">{deliveryEstimate(product.shippingInformation)}</p>
        <div className="mt-auto pt-1">
          <StockBadge status={product.availabilityStatus} stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}
