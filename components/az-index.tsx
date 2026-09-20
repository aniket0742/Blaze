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
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-sm font-medium transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
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

      <div className="mt-5 space-y-4">
        {[...byLetter.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([letter, items]) => (
            <div key={letter} id={`letter-${letter}`} className="flex scroll-mt-36 gap-3">
              <span className="w-6 shrink-0 text-xl font-semibold tracking-tight text-brand-500">
                {letter}
              </span>
              <ul className="flex flex-wrap gap-1.5">
                {items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle px-2.5 py-1 text-[13px] transition-colors hover:border-brand-300 hover:text-brand-600"
                    >
                      {c.name}
                      <span className="text-[11px] text-muted">{c.productCount}</span>
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
