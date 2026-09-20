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

const linkClass =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-lg border border-border-subtle px-3 text-[13px] transition-colors hover:border-brand-300 hover:text-brand-600";

export function Pagination({ query, page, pageCount }: { query: SearchQuery; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;

  return (
    <nav aria-label="Search results pages" className="mt-6 flex flex-wrap items-center gap-1.5">
      {page > 1 && (
        <Link href={searchHref(query, { page: page - 1 })} className={linkClass} rel="prev">
          ← Prev
        </Link>
      )}

      {pageWindow(page, pageCount).map((p) => (
        <Link
          key={p}
          href={searchHref(query, { page: p })}
          aria-current={p === page ? "page" : undefined}
          className={
            p === page
              ? "inline-flex h-9 min-w-9 items-center justify-center rounded-lg bg-brand-600 px-3 text-[13px] font-medium text-white"
              : linkClass
          }
        >
          {p}
        </Link>
      ))}

      {page < pageCount && (
        <Link href={searchHref(query, { page: page + 1 })} className={linkClass} rel="next">
          Next →
        </Link>
      )}
    </nav>
  );
}
