import { NUTRISCORE_GRADES, isNutriscoreGrade, nutriscoreMeaning } from "@/lib/product";

/**
 * The Nutri-Score scheme's own A–E colours, each paired with whichever text
 * colour clears WCAG AA against it. E is the one exception: the official red
 * fails with both white and dark text, so it is darkened just far enough
 * (#E63E11 → #D83A0F, 4.63:1 with white).
 */
const STYLE: Record<string, string> = {
  a: "bg-[#038141] text-white",
  b: "bg-[#85BB2F] text-foreground",
  c: "bg-[#FECB02] text-foreground",
  d: "bg-[#EE8100] text-foreground",
  e: "bg-[#D83A0F] text-white",
};

/** One letter, for cards. Renders nothing for an ungraded product. */
export function NutriscoreChip({ grade }: { grade: string | null }) {
  if (!isNutriscoreGrade(grade)) return null;
  return (
    <span
      title={`Nutri-Score ${grade.toUpperCase()}: ${nutriscoreMeaning(grade)}`}
      className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-bold ${STYLE[grade]}`}
    >
      <span aria-hidden>{grade.toUpperCase()}</span>
      <span className="sr-only">
        Nutri-Score {grade.toUpperCase()}: {nutriscoreMeaning(grade)}
      </span>
    </span>
  );
}

/**
 * The full A–E scale with the product's grade raised, the way the scheme
 * itself presents it. Renders nothing for an ungraded product.
 */
export function NutriscoreScale({ grade }: { grade: string | null }) {
  if (!isNutriscoreGrade(grade)) return null;
  return (
    <figure className="inline-flex flex-col gap-1.5">
      <figcaption className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Nutri-Score
      </figcaption>
      <div className="flex items-end gap-0.5" aria-hidden>
        {NUTRISCORE_GRADES.map((g) => (
          <span
            key={g}
            className={`flex items-center justify-center font-bold ${STYLE[g]} ${
              g === grade
                ? "h-10 w-10 rounded-md text-lg ring-2 ring-foreground ring-offset-2 ring-offset-page"
                : "h-7 w-7 rounded text-[12px] opacity-45"
            }`}
          >
            {g.toUpperCase()}
          </span>
        ))}
      </div>
      <p className="text-[13px] font-medium">
        <span className="sr-only">Nutri-Score {grade.toUpperCase()}: </span>
        {nutriscoreMeaning(grade)}
      </p>
    </figure>
  );
}
