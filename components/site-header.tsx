import Link from "next/link";
import { AccountMenu } from "./account-menu";
import { Wordmark } from "./brand";
import { CartBadge } from "./cart-badge";
import { MenuIcon } from "./icons";
import { SearchField } from "./search-field";

/** Three editorial entry points rather than a department strip. */
const NAV = [
  { href: "/#aisles", label: "Aisles" },
  { href: "/search?sort=discount", label: "Price watch" },
  { href: "/search?sort=popular", label: "Most scanned" },
];

/**
 * One calm row on desktop: mark, a few words of navigation, a compact search,
 * account and bag. Phones get the same things in two rows, with the navigation
 * folded into a native <details> menu so it works without JavaScript.
 */
export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-page/95 backdrop-blur supports-[backdrop-filter]:bg-page/85">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center gap-2 sm:gap-4">
          <Wordmark />

          <nav aria-label="Primary" className="ml-6 hidden md:block">
            <ul className="flex items-center gap-1">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <SearchField id="site-search-desktop" className="mr-2 hidden w-64 lg:block xl:w-72" />
            <AccountMenu />
            <CartBadge />

            <details className="relative md:hidden">
              <summary
                className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md transition-colors hover:bg-surface"
                aria-label="Menu"
              >
                <MenuIcon />
              </summary>
              <nav
                aria-label="Primary"
                className="absolute right-0 z-50 mt-2 w-56 rounded-lg border border-border-subtle bg-background p-1.5 shadow-lift"
              >
                <ul>
                  {NAV.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className="block rounded px-3 py-2.5 text-sm hover:bg-surface">
                        {item.label}
                      </Link>
                    </li>
                  ))}
                  <li className="mt-1 border-t border-border-subtle pt-1">
                    <Link href="/orders" className="block rounded px-3 py-2.5 text-sm hover:bg-surface">
                      Your orders
                    </Link>
                  </li>
                </ul>
              </nav>
            </details>
          </div>
        </div>

        {/* Below lg, search gets its own full-width row rather than being squeezed. */}
        <div className="pb-3 lg:hidden">
          <SearchField id="site-search-mobile" />
        </div>
      </div>
    </header>
  );
}
