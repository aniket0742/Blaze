import { SearchIcon } from "./icons";

/**
 * A plain GET form — no client JavaScript. The /search route it submits to is
 * built in the search milestone; the field is here now so the header layout is
 * final rather than reshuffled later.
 */
/** `id` is required because the header renders this twice — once for desktop,
 *  once for the mobile row — and duplicate ids break the label association. */
export function SearchField({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form action="/search" role="search" className={`relative flex-1 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products, brands and categories
      </label>
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        id={id}
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Search products, brands & categories…"
        className="h-11 w-full rounded-xl border border-border-subtle bg-surface pl-10 pr-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand-400 focus:bg-background focus:ring-2 focus:ring-brand-200"
      />
    </form>
  );
}
