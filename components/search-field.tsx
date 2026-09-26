import { SearchIcon } from "./icons";

/**
 * A plain GET form that submits to /search — no client JavaScript at all.
 *
 * `id` is required because the header renders this twice, once for desktop and
 * once for the mobile row, and duplicate ids break the label association.
 */
export function SearchField({ id, className = "" }: { id: string; className?: string }) {
  return (
    <form action="/search" role="search" className={`relative ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search products, brands and aisles
      </label>
      <input
        id={id}
        name="q"
        type="search"
        autoComplete="off"
        placeholder="Search the shelves"
        className="h-10 w-full rounded-md border border-border-field bg-background pl-3 pr-10 text-sm outline-none transition-colors placeholder:text-muted focus:border-foreground"
      />
      {/* An explicit submit, so touch keyboards without a search key can still search. */}
      <button
        type="submit"
        aria-label="Search"
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-muted transition-colors hover:text-foreground"
      >
        <SearchIcon className="h-[18px] w-[18px]" />
      </button>
    </form>
  );
}
