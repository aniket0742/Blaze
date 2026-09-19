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
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border-subtle bg-background transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square bg-surface">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
        />
        {hasDiscount && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-500 px-2 py-1 text-[11px] font-semibold text-white">
            {discountLabel(product.discountPercentage)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">
          {product.brand ?? "Blaze Marketplace"}
        </p>
        <h3 className="line-clamp-2 text-sm font-medium leading-snug">{product.title}</h3>

        <div className="flex items-center gap-1.5 text-xs text-muted">
          <RatingStars rating={product.rating} className="text-sm" />
          <span>{product.rating.toFixed(1)}</span>
          <span aria-hidden>·</span>
          <span>{product.reviewCount} reviews</span>
        </div>

        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-lg font-semibold tracking-tight">
            {formatPrice(product.pricePaise)}
          </span>
          {hasDiscount && (
            <span className="text-xs text-muted line-through">{formatPrice(product.mrpPaise)}</span>
          )}
        </div>

        <p className="text-xs text-muted">{deliveryEstimate(product.shippingInformation)}</p>
        <div className="mt-auto pt-2">
          <StockBadge status={product.availabilityStatus} stock={product.stock} />
        </div>
      </div>
    </Link>
  );
}
