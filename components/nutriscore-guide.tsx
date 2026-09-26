import Link from "next/link";
import { NUTRISCORE_GRADES, nutriscoreMeaning } from "@/lib/product";
import { NutriscoreChip } from "./nutriscore-badge";
import { button } from "./ui";

/**
 * A short explainer for the one quality signal Blaze shows everywhere. The
 * wording for each grade is the Nutri-Score scheme's own.
 */
export function NutriscoreGuide() {
  return (
    <div className="grid gap-8 rounded-2xl bg-foreground p-6 text-page sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-page/70">How to read it</p>
        <h2 className="mt-2 font-display text-3xl leading-tight tracking-tight sm:text-4xl">
          A to E, on the front of every product.
        </h2>
        <p className="mt-3 max-w-md text-[14px] leading-relaxed text-page/80">
          The Nutri-Score grades a product&apos;s overall nutritional quality from A, the best, to E. Open
          Food Facts computes it from the product&apos;s own nutrition facts; Blaze shows it wherever the
          product appears, and leaves it off when there is no grade.
        </p>
        <Link href="/search?nutriscore=b" className={`${button("inverse")} mt-5`}>
          Shop A and B
        </Link>
      </div>
      <ul className="grid gap-2 sm:grid-cols-5">
        {NUTRISCORE_GRADES.map((g) => (
          <li key={g} className="flex items-center gap-3 rounded-lg bg-page/10 p-3 sm:flex-col sm:items-start">
            <NutriscoreChip grade={g} />
            {/* The chip already announces its meaning; this is the sighted copy. */}
            <span aria-hidden className="text-[13px] leading-snug text-page/90">
              {nutriscoreMeaning(g)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
