"use client";

import { useRouter } from "next/navigation";
import { SORT_OPTIONS, searchHref, type SearchQuery, type SortKey } from "@/lib/search-params";
import { field } from "./ui";

/**
 * The only client component in search. A native select that navigates on
 * change — the rest of the filtering is plain links and a GET form.
 */
export function SortSelect({ query }: { query: SearchQuery }) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      <label htmlFor="sort" className="shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        Sort by
      </label>
      <select
        id="sort"
        value={query.sort}
        onChange={(e) => router.push(searchHref(query, { sort: e.target.value as SortKey }))}
        className={`${field} h-10 w-auto min-w-48`}
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
