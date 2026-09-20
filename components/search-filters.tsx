import Link from "next/link";
import { formatPrice } from "@/lib/format";
import { hasActiveFilters, searchHref, type SearchQuery } from "@/lib/search-params";
import { RatingStars } from "./rating-stars";

type Category = { slug: string; name: string; productCount: number };

const RATINGS = [4, 3, 2] as const;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-border-subtle py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-[13px] font-semibold">{title}</h3>
      {children}
    </div>
  );
}

function Option({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={`block rounded-lg px-2 py-1.5 text-[13px] transition-colors ${
        active ? "bg-brand-50 font-medium text-brand-700" : "text-muted hover:bg-surface hover:text-foreground"
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
    <div className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-sm font-semibold">Filters</h2>
        {hasActiveFilters(query) && (
          <Link
            href={searchHref(query, {
              category: "",
              minPrice: null,
              maxPrice: null,
              minRating: null,
            })}
            className="text-[12px] font-medium text-brand-600 hover:underline"
          >
            Clear all
          </Link>
        )}
      </div>

      <div className="mt-3">
        <Group title="Category">
          <div className="max-h-64 overflow-y-auto pr-1">
            <Option href={searchHref(query, { category: "" })} active={!query.category}>
              All categories
            </Option>
            {categories.map((c) => (
              <Option
                key={c.slug}
                href={searchHref(query, { category: c.slug })}
                active={query.category === c.slug}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate">{c.name}</span>
                  <span className="text-[11px] text-muted">{c.productCount}</span>
                </span>
              </Option>
            ))}
          </div>
        </Group>

        <Group title="Price">
          {/* A plain GET form: the other active filters ride along as hidden
              fields so applying a price range doesn't drop them. */}
          <form action="/search" className="space-y-2">
            {query.q && <input type="hidden" name="q" value={query.q} />}
            {query.category && <input type="hidden" name="category" value={query.category} />}
            {query.minRating !== null && (
              <input type="hidden" name="minRating" value={query.minRating} />
            )}
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
                placeholder="Min"
                defaultValue={query.minPrice ?? ""}
                className="h-9 w-full rounded-lg border border-border-subtle bg-surface px-2 text-[13px] outline-none focus:border-brand-400 focus:bg-background"
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
                placeholder="Max"
                defaultValue={query.maxPrice ?? ""}
                className="h-9 w-full rounded-lg border border-border-subtle bg-surface px-2 text-[13px] outline-none focus:border-brand-400 focus:bg-background"
              />
            </div>
            <p className="text-[11px] text-muted">
              Catalog range {formatPrice(priceBounds.min)} – {formatPrice(priceBounds.max)}
            </p>
            <button
              type="submit"
              className="h-9 w-full rounded-lg bg-brand-600 text-[13px] font-medium text-white transition-colors hover:bg-brand-700"
            >
              Apply price
            </button>
          </form>
        </Group>

        <Group title="Customer rating">
          <Option href={searchHref(query, { minRating: null })} active={query.minRating === null}>
            Any rating
          </Option>
          {RATINGS.map((r) => (
            <Option
              key={r}
              href={searchHref(query, { minRating: r })}
              active={query.minRating === r}
            >
              <span className="flex items-center gap-1.5">
                <RatingStars rating={r} className="text-xs" />
                <span>{r} &amp; up</span>
              </span>
            </Option>
          ))}
        </Group>
      </div>
    </div>
  );
}
