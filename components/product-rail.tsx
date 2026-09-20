import type { Product } from "@/lib/db/schema";
import { ProductCard } from "./product-card";

/**
 * Horizontal scrolling row. Keeps several products per screen without the
 * vertical cost of a grid, so more of the catalog sits above the fold.
 */
export function ProductRail({ products }: { products: Product[] }) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {products.map((p) => (
        <li key={p.id} className="w-[152px] shrink-0 snap-start sm:w-[180px]">
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
