import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ProductGrid } from "@/components/product-grid";
import { SearchFilters } from "@/components/search-filters";
import { SortSelect } from "@/components/sort-select";
import { PageTitle } from "@/components/ui";
import { getCategoriesWithCounts, getPriceBounds } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { hasActiveFilters, parseSearchQuery, searchHref, type SearchQuery } from "@/lib/search-params";
import { searchProducts } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

/** The header's editorial links land here, so the title says what is showing. */
function titleFor(q: SearchQuery, categoryName: string | undefined): string {
  if (q.q) return `“${q.q}”`;
  if (categoryName) return categoryName;
  switch (q.sort) {
    case "discount":
      return "Price watch";
    case "popular":
      return "Most scanned";
    case "newest":
      return "New to the shelf";
    case "nutriscore":
      return "Best Nutri-Score first";
    default:
      return "Everything on the shelves";
  }
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const query = parseSearchQuery(await searchParams);

  const [categories, priceBounds, results] = await Promise.all([
    getCategoriesWithCounts(),
    getPriceBounds(),
    searchProducts(query),
  ]);

  const categoryName = categories.find((c) => c.slug === query.category)?.name;

  const chips = [
    categoryName && { label: categoryName, href: searchHref(query, { category: "" }) },
    (query.minPrice !== null || query.maxPrice !== null) && {
      label: `${query.minPrice !== null ? formatPrice(query.minPrice * 100) : "Any"} – ${
        query.maxPrice !== null ? formatPrice(query.maxPrice * 100) : "Any"
      }`,
      href: searchHref(query, { minPrice: null, maxPrice: null }),
    },
    query.nutriscore !== null && {
      label:
        query.nutriscore === "a" ? "Nutri-Score A" : `Nutri-Score A–${query.nutriscore.toUpperCase()}`,
      href: searchHref(query, { nutriscore: null }),
    },
  ].filter(Boolean) as { label: string; href: string }[];

  const filterProps = { categories, query, priceBounds };
  const count = `${results.total} ${results.total === 1 ? "product" : "products"}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4 border-b border-foreground pb-6">
        <PageTitle eyebrow={query.q ? "Search results" : "Browse"} title={titleFor(query, categoryName)}>
          <p>
            {results.total === 0 ? "No matching products" : count}
            {results.pageCount > 1 && ` · page ${results.page} of ${results.pageCount}`}
          </p>
        </PageTitle>
        <SortSelect query={query} />
      </div>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Active filters">
          {chips.map((chip) => (
            <li key={chip.href}>
              <Link
                href={chip.href}
                className="inline-flex items-center gap-2 rounded-full bg-foreground py-1 pl-3 pr-2 text-[13px] font-medium text-page transition-colors hover:bg-foreground/85"
              >
                {chip.label}
                <span aria-hidden className="text-page/70">
                  ✕
                </span>
                <span className="sr-only">— remove this filter</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 lg:grid lg:grid-cols-[240px_1fr] lg:gap-10">
        {/* Phones and tablets: a native disclosure, so filters need no JavaScript. */}
        <details className="mb-6 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-md border border-border-field bg-background px-4 py-3 text-sm font-medium">
            <span>
              Filters{hasActiveFilters(query) && ` · ${chips.length} on`}
            </span>
            <span aria-hidden className="text-muted">
              +
            </span>
          </summary>
          <div className="mt-3">
            <SearchFilters {...filterProps} idPrefix="m" />
          </div>
        </details>

        <aside className="hidden lg:block" aria-label="Filters">
          <SearchFilters {...filterProps} idPrefix="d" />
        </aside>

        <div>
          {results.items.length === 0 ? (
            <EmptyState
              title="Nothing on the shelves matches that"
              description="Try fewer filters, a wider price range, or a different spelling."
              actionHref={
                hasActiveFilters(query)
                  ? searchHref(query, { category: "", minPrice: null, maxPrice: null, nutriscore: null })
                  : "/"
              }
              actionLabel={hasActiveFilters(query) ? "Clear filters" : "Back to home"}
            />
          ) : (
            <>
              <ProductGrid products={results.items} />
              <Pagination query={query} page={results.page} pageCount={results.pageCount} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
