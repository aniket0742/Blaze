import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { gradesUpTo, hasActiveFilters, searchHref, type SearchQuery } from "@/lib/search-params";
import { NutriscoreChip } from "./nutriscore-badge";
import { button, field } from "./ui";

type Category = { slug: string; name: string; productCount: number };

/** "b" reads as "A or B". E is not offered: "E or better" is every graded product. */
const GRADES = [
  { grade: "a", label: "A only" },
  { grade: "b", label: "A or B" },
  { grade: "c", label: "A to C" },
  { grade: "d", label: "A to D" },
] as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-subtle py-5 first:border-t-0 first:pt-0">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{title}</h3>
      {children}
    </div>
  );
}

function Option({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-[14px] transition-colors ${
        active ? "bg-foreground font-medium text-page" : "hover:bg-surface"
      }`}
    >
      {children}
    </Link>
  );
}

/** `idPrefix` is required: the search page renders this panel twice — once in
 *  the mobile disclosure, once in the desktop sidebar — and the price inputs
 *  would otherwise share ids, breaking their labels. */
export function SearchFilters({
  categories,
  query,
  priceBounds,
  idPrefix,
}: {
  categories: Category[];
  query: SearchQuery;
  priceBounds: { min: number; max: number };
  idPrefix: string;
}) {
  const minId = `${idPrefix}-minPrice`;
  const maxId = `${idPrefix}-maxPrice`;
  return (
    <div className="lg:sticky lg:top-24">
      {hasActiveFilters(query) && (
        <Link
          href={searchHref(query, { category: "", minPrice: null, maxPrice: null, nutriscore: null })}
          className="mb-4 inline-block text-[13px] font-medium underline decoration-border-field underline-offset-4 hover:decoration-foreground"
        >
          Clear all filters
        </Link>
      )}

      <Group title="Aisle">
        <div className="max-h-72 space-y-0.5 overflow-y-auto pr-1">
          <Option href={searchHref(query, { category: "" })} active={!query.category}>
            Every aisle
          </Option>
          {categories.map((c) => (
            <Option key={c.slug} href={searchHref(query, { category: c.slug })} active={query.category === c.slug}>
              <span className="truncate">{c.name}</span>
              <span className={`shrink-0 font-mono text-[11px] ${query.category === c.slug ? "text-page/70" : "text-muted"}`}>
                {c.productCount}
              </span>
            </Option>
          ))}
        </div>
      </Group>

      <Group title="Nutri-Score">
        <div className="space-y-0.5">
          <Option href={searchHref(query, { nutriscore: null })} active={query.nutriscore === null}>
            Any, including ungraded
          </Option>
          {GRADES.map(({ grade, label }) => (
            <Option key={grade} href={searchHref(query, { nutriscore: grade })} active={query.nutriscore === grade}>
              <span>{label}</span>
              {/* The grades the option includes; the label already says it in words. */}
              <span aria-hidden className="flex -space-x-1">
                {gradesUpTo(grade).map((g) => (
                  <NutriscoreChip key={g} grade={g} />
                ))}
              </span>
            </Option>
          ))}
        </div>
      </Group>

      <Group title="Price">
        {/* A plain GET form: the other active filters ride along as hidden
            fields so applying a price range doesn't drop them. */}
        <form action="/search" className="space-y-3">
          {query.q && <input type="hidden" name="q" value={query.q} />}
          {query.category && <input type="hidden" name="category" value={query.category} />}
          {query.nutriscore !== null && <input type="hidden" name="nutriscore" value={query.nutriscore} />}
          {query.sort !== "relevance" && <input type="hidden" name="sort" value={query.sort} />}

          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor={minId}>
              Minimum price in rupees
            </label>
            <input
              id={minId}
              name="minPrice"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="₹ min"
              defaultValue={query.minPrice ?? ""}
              className={`${field} h-10`}
            />
            <span className="text-muted" aria-hidden>
              –
            </span>
            <label className="sr-only" htmlFor={maxId}>
              Maximum price in rupees
            </label>
            <input
              id={maxId}
              name="maxPrice"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="₹ max"
              defaultValue={query.maxPrice ?? ""}
              className={`${field} h-10`}
            />
          </div>
          <p className="text-[12px] text-muted">
            Shelf prices run from {formatPrice(priceBounds.min)} to {formatPrice(priceBounds.max)}
          </p>
          <button type="submit" className={`${button("secondary", "sm")} w-full`}>
            Apply price
          </button>
        </form>
      </Group>
    </div>
  );
}
