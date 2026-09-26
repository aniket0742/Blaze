/**
 * Pure query-string helpers. Deliberately free of database imports so client
 * components (the sort select) can use them without pulling the Postgres
 * driver into the browser bundle.
 */
import { NUTRISCORE_GRADES, isNutriscoreGrade, type NutriscoreGrade } from "./product";

export const PAGE_SIZE = 24;

export const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "nutriscore", label: "Nutri-Score: best first" },
  { value: "popular", label: "Most scanned" },
  { value: "newest", label: "Newest arrivals" },
  { value: "discount", label: "Biggest discount" },
] as const;

export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export type SearchQuery = {
  q: string;
  category: string;
  /** Rupees, as typed by the shopper. Converted to paise at query time. */
  minPrice: number | null;
  maxPrice: number | null;
  /** The worst Nutri-Score still accepted: "b" means A or B. */
  nutriscore: NutriscoreGrade | null;
  sort: SortKey;
  page: number;
};

function first(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

function positiveNumber(v: string | string[] | undefined): number | null {
  const raw = first(v);
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseSearchQuery(raw: Record<string, string | string[] | undefined>): SearchQuery {
  const sort = SORT_OPTIONS.find((o) => o.value === first(raw.sort))?.value ?? "relevance";

  let minPrice = positiveNumber(raw.minPrice);
  let maxPrice = positiveNumber(raw.maxPrice);
  // A reversed range is a typo, not an empty result set.
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const grade = first(raw.nutriscore).toLowerCase();
  const page = Math.trunc(Number(first(raw.page)));

  return {
    q: first(raw.q).trim().slice(0, 100),
    category: first(raw.category),
    minPrice,
    maxPrice,
    nutriscore: isNutriscoreGrade(grade) ? grade : null,
    sort,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

/** Build a URL for a modified query. Any change resets to page 1 unless the
 *  patch sets a page explicitly. */
export function searchHref(current: SearchQuery, patch: Partial<SearchQuery>): string {
  const next = { ...current, page: 1, ...patch };
  const sp = new URLSearchParams();
  if (next.q) sp.set("q", next.q);
  if (next.category) sp.set("category", next.category);
  if (next.minPrice !== null) sp.set("minPrice", String(next.minPrice));
  if (next.maxPrice !== null) sp.set("maxPrice", String(next.maxPrice));
  if (next.nutriscore !== null) sp.set("nutriscore", next.nutriscore);
  if (next.sort !== "relevance") sp.set("sort", next.sort);
  if (next.page > 1) sp.set("page", String(next.page));
  const qs = sp.toString();
  return qs ? `/search?${qs}` : "/search";
}

export function hasActiveFilters(q: SearchQuery): boolean {
  return Boolean(q.category || q.minPrice !== null || q.maxPrice !== null || q.nutriscore !== null);
}

/** Every grade at least as good as the chosen one: "b" → ["a", "b"]. */
export function gradesUpTo(grade: NutriscoreGrade): NutriscoreGrade[] {
  return NUTRISCORE_GRADES.slice(0, NUTRISCORE_GRADES.indexOf(grade) + 1);
}
