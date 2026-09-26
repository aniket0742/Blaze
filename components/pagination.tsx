import Link from "next/link";
import { searchHref, type SearchQuery } from "@/lib/search-params";

/** Windowed page numbers so long result sets don't produce a huge strip. */
function pageWindow(page: number, pageCount: number): number[] {
  const span = 2;
  const start = Math.max(1, Math.min(page - span, pageCount - span * 2));
  const end = Math.min(pageCount, Math.max(page + span, span * 2 + 1));
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return pages;
}

const cell =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 font-mono text-[13px] transition-colors";

export function Pagination({ query, page, pageCount }: { query: SearchQuery; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Result pages" className="mt-12 flex flex-wrap items-center justify-center gap-1 border-t border-border-subtle pt-6">
      {page > 1 && (
        <Link href={searchHref(query, { page: page - 1 })} className={`${cell} hover:bg-surface`} rel="prev">
          ← Previous
        </Link>
      )}

      {pageWindow(page, pageCount).map((p) => (
        <Link
          key={p}
          href={searchHref(query, { page: p })}
          aria-current={p === page ? "page" : undefined}
          aria-label={`Page ${p}`}
          className={`${cell} ${p === page ? "bg-foreground text-page" : "hover:bg-surface"}`}
        >
          {p}
        </Link>
      ))}

      {page < pageCount && (
        <Link href={searchHref(query, { page: page + 1 })} className={`${cell} hover:bg-surface`} rel="next">
          Next →
        </Link>
      )}
    </nav>
  );
}
