import type { Product } from "@/lib/db/schema";

type Row = { label: string; value: string };

/**
 * Only rows the catalog actually has a value for. SKU is deliberately absent —
 * the seeded values carry source-brand abbreviations, see DECISIONS.md.
 */
function rowsFor(product: Product, categoryName: string): Row[] {
  const d = product.dimensions;
  return [
    { label: "Brand", value: product.brand ?? "Blaze Marketplace" },
    { label: "Category", value: categoryName },
    d && {
      label: "Dimensions (W × H × D)",
      value: `${d.width} × ${d.height} × ${d.depth} cm`,
    },
    product.weightGrams != null && { label: "Weight", value: `${product.weightGrams} g` },
    product.warrantyInformation && { label: "Warranty", value: product.warrantyInformation },
    product.returnPolicy && { label: "Returns", value: product.returnPolicy },
    { label: "Shipping", value: product.shippingInformation },
  ].filter(Boolean) as Row[];
}

export function ProductSpecs({
  product,
  categoryName,
}: {
  product: Product;
  categoryName: string;
}) {
  return (
    <div>
      <dl className="divide-y divide-border-subtle text-sm">
        {rowsFor(product, categoryName).map((row) => (
          <div key={row.label} className="grid grid-cols-[minmax(0,7rem)_1fr] gap-3 py-2.5">
            <dt className="text-muted">{row.label}</dt>
            <dd className="font-medium">{row.value}</dd>
          </div>
        ))}
      </dl>

      {product.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {product.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-border-subtle bg-surface px-2.5 py-1 text-[12px] text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
