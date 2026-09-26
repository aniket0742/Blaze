import Image from "next/image";
import Link from "next/link";

type Aisle = { slug: string; name: string; heroImage: string | null; productCount: number };

/**
 * Blaze's "everything, A to Z" principle as the store's directory: every
 * department, alphabetical, numbered like the aisles of a real shop and set
 * like a table of contents. The numbers follow the alphabet, so they never
 * claim anything about the data.
 */
export function AisleDirectory({ aisles }: { aisles: Aisle[] }) {
  const sorted = [...aisles].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <ul className="grid gap-x-10 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((aisle, i) => (
        <li key={aisle.slug} className="border-b border-border-subtle">
          <Link href={`/category/${aisle.slug}`} className="group flex items-center gap-4 py-3.5">
            <span
              aria-hidden
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface font-display text-2xl text-brand-600 transition-colors group-hover:bg-foreground group-hover:text-page"
            >
              {aisle.name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-mono text-[11px] text-muted">Aisle {String(i + 1).padStart(2, "0")}</span>
              <span className="block text-[15px] font-medium leading-snug group-hover:underline group-hover:underline-offset-2">
                {aisle.name}
              </span>
            </span>
            <span className="shrink-0 font-mono text-[12px] text-muted tabular-nums">
              {aisle.productCount}
              <span className="sr-only"> products</span>
            </span>
            {aisle.heroImage && (
              <span className="relative hidden h-12 w-10 shrink-0 overflow-hidden rounded-md bg-surface sm:block">
                <Image src={aisle.heroImage} alt="" fill sizes="40px" className="object-contain p-1 mix-blend-multiply" />
              </span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
