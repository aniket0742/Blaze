import type { Product } from "@/lib/db/schema";
import { ProductCard } from "./product-card";

/** The one product grid, so the home page, aisles and search line up alike. */
export function ProductGrid({ products, dense = false }: { products: Product[]; dense?: boolean }) {
  return (
    <ul
      className={`grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-5 ${
        dense ? "lg:grid-cols-4 xl:grid-cols-5" : "lg:grid-cols-4"
      }`}
    >
      {products.map((p) => (
        <li key={p.id}>
          <ProductCard product={p} />
        </li>
      ))}
    </ul>
  );
}
