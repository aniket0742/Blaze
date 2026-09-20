import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { discountLabel, formatPrice } from "@/lib/format";

/** Image-first tile. Inside the module the picture carries the message and
 *  the badge carries the offer, so text stays to a single line. */
function DealTile({ product }: { product: Product }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-background">
        <Image
          src={product.thumbnail}
          alt={product.title}
          fill
          sizes="(max-width: 640px) 40vw, 180px"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute bottom-2 left-2 rounded-md bg-brand-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
          {discountLabel(product.discountPercentage)}
        </span>
      </div>
      <p className="mt-1.5 truncate text-[12px] text-muted">{product.title}</p>
      <p className="text-[13px] font-semibold">{formatPrice(product.pricePaise)}</p>
    </Link>
  );
}

/**
 * The page's heaviest module: a wide, tinted block holding four deals in a
 * 2×2 grid. Weight comes from size and a soft brand tint rather than a
 * saturated fill, so the orange stays selective.
 */
export function DealsModule({ products }: { products: Product[] }) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-brand-100 bg-brand-50 p-4 shadow-card sm:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight sm:text-xl">Deals delivered fast</h2>
        <Link
          href="/search?sort=discount"
          className="shrink-0 text-[13px] font-medium text-brand-600 hover:underline"
        >
          View all →
        </Link>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 sm:gap-4">
        {products.map((p) => (
          <DealTile key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
