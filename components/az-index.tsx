import Link from "next/link";

type Category = { slug: string; name: string; productCount: number };

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/**
 * Blaze's "everything, A to Z" principle rendered as something useful: an
 * alphabetical index of every category we actually carry. Letters with no
 * categories are shown dimmed so the breadth — and its edges — are honest.
 */
export function AzIndex({ categories }: { categories: Category[] }) {
  const byLetter = new Map<string, Category[]>();
  for (const c of categories) {
    const letter = c.name[0]?.toUpperCase() ?? "#";
    byLetter.set(letter, [...(byLetter.get(letter) ?? []), c]);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {LETTERS.map((letter) => {
          const has = byLetter.has(letter);
          return has ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-sm font-medium transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-700/20"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              aria-hidden
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-border-subtle"
            >
              {letter}
            </span>
          );
        })}
      </div>

      <div className="mt-8 space-y-8">
        {[...byLetter.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, items]) => (
            <div key={letter} id={`letter-${letter}`} className="scroll-mt-24">
              <div className="flex items-baseline gap-3 border-b border-border-subtle pb-2">
                <span className="text-3xl font-semibold tracking-tight text-brand-500">
                  {letter}
                </span>
                <span className="text-xs text-muted">
                  {items.length} {items.length === 1 ? "category" : "categories"}
                </span>
              </div>
              <ul className="mt-3 flex flex-wrap gap-2">
                {items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="inline-flex items-center gap-2 rounded-full border border-border-subtle px-3 py-1.5 text-sm transition-colors hover:border-brand-400 hover:text-brand-600"
                    >
                      {c.name}
                      <span className="text-xs text-muted">{c.productCount}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </div>
  );
}
