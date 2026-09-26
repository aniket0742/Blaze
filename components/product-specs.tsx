import Link from "next/link";
import type { Product } from "@/lib/db/schema";
import { humaniseTag, novaMeaning, nutriscoreMeaning } from "@/lib/product";

type Row = { label: string; value: React.ReactNode };

/** Only rows Open Food Facts actually has a value for. */
function rowsFor(product: Product, categoryName: string): Row[] {
  const nutri = nutriscoreMeaning(product.nutriscoreGrade);
  const nova = novaMeaning(product.novaGroup);
  return [
    product.brand && { label: "Brand", value: product.brand },
    {
      label: "Aisle",
      value: (
        <Link href={`/category/${product.categorySlug}`} className="underline decoration-border-field underline-offset-2 hover:decoration-foreground">
          {categoryName}
        </Link>
      ),
    },
    product.quantity && { label: "Pack size", value: product.quantity },
    nutri && { label: "Nutri-Score", value: `${product.nutriscoreGrade!.toUpperCase()} — ${nutri}` },
    nova && { label: "NOVA group", value: `${product.novaGroup} — ${nova}` },
    { label: "Barcode", value: <span className="font-mono">{product.barcode}</span> },
  ].filter(Boolean) as Row[];
}

export function ProductSpecs({ product, categoryName }: { product: Product; categoryName: string }) {
  return (
    <div>
      <dl className="divide-y divide-border-subtle border-y border-border-subtle text-[14px]">
        {rowsFor(product, categoryName).map((row) => (
          <div key={row.label} className="grid grid-cols-[8rem_1fr] gap-4 py-3">
            <dt className="text-muted">{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>

      {product.labels.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Labels">
          {product.labels.map((tag) => (
            <li key={tag} className="rounded-full border border-border-field px-3 py-1 text-[13px]">
              {humaniseTag(tag)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
