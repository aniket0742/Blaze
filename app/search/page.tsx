import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { Pagination } from "@/components/pagination";
import { ProductCard } from "@/components/product-card";
import { SearchFilters } from "@/components/search-filters";
import { SortSelect } from "@/components/sort-select";
import { getCategoriesWithCounts, getPriceBounds } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { hasActiveFilters, parseSearchQuery, searchHref } from "@/lib/search-params";
import { searchProducts } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  robots: { index: false },
};

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
    query.minRating !== null && {
      label: `${query.minRating} stars & up`,
      href: searchHref(query, { minRating: null }),
    },
  ].filter(Boolean) as { label: string; href: string }[];

  const filterProps = { categories, query, priceBounds };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {query.q ? `Results for “${query.q}”` : "All products"}
          </h1>
          <p className="mt-1 text-[13px] text-muted">
            {results.total === 0
              ? "No matching products"
              : `${results.total} ${results.total === 1 ? "product" : "products"}`}
            {results.pageCount > 1 && ` · page ${results.page} of ${results.pageCount}`}
          </p>
        </div>
        <SortSelect query={query} />
      </header>

      {chips.length > 0 && (
        <ul className="mt-4 flex flex-wrap items-center gap-2">
          {chips.map((chip) => (
            <li key={chip.href}>
              <Link
                href={chip.href}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[12px] font-medium text-brand-700 transition-colors hover:border-brand-400"
              >
                {chip.label}
                <span aria-hidden>×</span>
                <span className="sr-only">Remove filter</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        {/* Mobile: a native disclosure, so filters need no JavaScript. */}
        <details className="mb-4 lg:hidden">
          <summary className="cursor-pointer rounded-xl border border-border-subtle bg-background px-4 py-2.5 text-[13px] font-medium shadow-card">
            Filters{hasActiveFilters(query) && ` (${chips.length})`}
          </summary>
          <div className="mt-3">
            <SearchFilters {...filterProps} idPrefix="m" />
          </div>
        </details>

        <aside className="hidden lg:block">
          <SearchFilters {...filterProps} idPrefix="d" />
        </aside>

        <div>
          {results.items.length === 0 ? (
            <EmptyState
              title="No products match this search"
              description="Try fewer filters, a wider price range, or a different spelling."
              actionHref={
                hasActiveFilters(query)
                  ? searchHref(query, {
                      category: "",
                      minPrice: null,
                      maxPrice: null,
                      minRating: null,
                    })
                  : "/"
              }
              actionLabel={hasActiveFilters(query) ? "Clear filters" : "Back to home"}
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {results.items.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              <Pagination query={query} page={results.page} pageCount={results.pageCount} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
