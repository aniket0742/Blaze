"use client";

import { useRouter } from "next/navigation";
import { SORT_OPTIONS, searchHref, type SearchQuery, type SortKey } from "@/lib/search-params";

/**
 * The only client component in search. A native select that navigates on
 * change — the rest of the filtering is plain links and a GET form.
 */
export function SortSelect({ query }: { query: SearchQuery }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="shrink-0 text-[13px] text-muted">
        Sort
      </label>
      <select
        id="sort"
        value={query.sort}
        onChange={(e) => router.push(searchHref(query, { sort: e.target.value as SortKey }))}
        className="h-9 rounded-lg border border-border-subtle bg-background px-2 text-[13px] outline-none focus:border-brand-400"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
