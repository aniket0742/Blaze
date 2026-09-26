import Link from "next/link";
import { FlameMark } from "./icons";

/**
 * Site-wide attribution, as the Open Food Facts terms of reuse require:
 * name the licence and credit Open Food Facts with a link. Each product page
 * also links to that product's own entry. See DECISIONS.md.
 */
const link = "underline decoration-border-field underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground";

const COLUMNS = [
  {
    title: "Shop",
    links: [
      { href: "/#aisles", label: "The aisles" },
      { href: "/search?sort=discount", label: "Price watch" },
      { href: "/search?sort=popular", label: "Most scanned" },
      { href: "/search", label: "Search everything" },
    ],
  },
  {
    title: "Your account",
    links: [
      { href: "/signin", label: "Sign in" },
      { href: "/orders", label: "Your orders" },
      { href: "/cart", label: "Your bag" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border-subtle bg-surface/60">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="flex items-center gap-1.5 font-display text-2xl font-semibold tracking-tight">
              <FlameMark className="h-5 w-5 text-brand-500" />
              Blaze
            </p>
            <p className="mt-3 max-w-sm font-display text-lg leading-snug text-muted">
              Real products at real shelf prices. Everything, A to Z.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{col.title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="transition-colors hover:text-brand-600">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 space-y-2 border-t border-border-subtle pt-6 text-[13px] leading-relaxed text-muted">
          <p className="max-w-3xl">
            Product information and images come from{" "}
            <a href="https://world.openfoodfacts.org" className={link}>
              Open Food Facts
            </a>
            , and shelf prices from{" "}
            <a href="https://prices.openfoodfacts.org" className={link}>
              Open Prices
            </a>
            , a companion database recording real prices from real shops. Both are available under the{" "}
            <a href="https://opendatacommons.org/licenses/odbl/1-0/" className={link}>
              Open Database License
            </a>
            ; product images under{" "}
            <a href="https://world.openfoodfacts.org/terms-of-use" className={link}>
              Creative Commons Attribution-ShareAlike
            </a>
            . Information is provided as-is and may be incomplete.
          </p>
          <p>Blaze is a demo storefront built for an assignment. Nothing here is for sale and no payment is ever taken.</p>
        </div>
      </div>
    </footer>
  );
}
