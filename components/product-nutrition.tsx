import type { Product } from "@/lib/db/schema";
import { humaniseTag, nutritionRows } from "@/lib/product";

/**
 * Ingredients and allergens, exactly as Open Food Facts records them. A
 * section the source has nothing for says so rather than disappearing, so an
 * empty allergen list is never mistaken for "contains no allergens".
 */
export function ProductIngredients({ product }: { product: Product }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Ingredients</h3>
        <p className="mt-2 text-[15px] leading-relaxed">
          {product.ingredientsText ?? <span className="text-muted">Not recorded on Open Food Facts.</span>}
        </p>
      </div>
      <div>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">Allergens</h3>
        {product.allergens.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {product.allergens.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[13px] font-medium text-amber-900"
              >
                {humaniseTag(tag)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[14px] text-muted">
            None recorded on Open Food Facts. Check the pack before relying on this.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Nutrition set like the panel on a real pack: a ruled box, a heavy rule
 * under the heading, per 100 g or per 100 ml exactly as the source reports.
 */
export function NutritionPanel({ product }: { product: Product }) {
  const rows = product.nutriments ? nutritionRows(product.nutriments) : [];
  const per = product.nutritionPer === "100ml" ? "100 ml" : "100 g";

  return (
    <div className="rounded-sm border-2 border-foreground bg-background p-4">
      <h3 className="font-display text-2xl font-semibold leading-none tracking-tight">Nutrition facts</h3>
      {rows.length > 0 ? (
        <>
          <p className="mt-1.5 border-b-8 border-foreground pb-2 text-[13px]">Typical values per {per}</p>
          <table className="w-full text-[14px]">
            <caption className="sr-only">Nutrition per {per}</caption>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-foreground/25 last:border-b-0">
                  <th
                    scope="row"
                    className={`py-1.5 text-left ${row.indent ? "pl-4 font-normal text-muted" : "font-semibold"}`}
                  >
                    {row.label}
                  </th>
                  <td className="py-1.5 text-right font-mono tabular-nums">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ) : (
        <p className="mt-3 border-t-8 border-foreground pt-3 text-[14px] text-muted">
          Not recorded on Open Food Facts.
        </p>
      )}
    </div>
  );
}
