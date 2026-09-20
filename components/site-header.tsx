import Link from "next/link";
import { Wordmark } from "./brand";
import { AccountMenu } from "./account-menu";
import { CartBadge } from "./cart-badge";

import { SearchField } from "./search-field";

const NAV = [
  { href: "/#categories", label: "Categories" },
  { href: "/#deals", label: "Today's Deals" },
  { href: "/#new", label: "New Arrivals" },
  { href: "/#browse", label: "Browse A–Z" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center gap-3 py-2.5 sm:gap-6">
          <Wordmark />
          <SearchField id="site-search-desktop" className="hidden sm:block" />
          <div className="ml-auto flex items-center gap-1 sm:ml-0">
            <AccountMenu />
            <CartBadge />
          </div>
        </div>

        {/* On small screens search gets its own row rather than being squeezed. */}
        <div className="pb-2.5 sm:hidden">
          <SearchField id="site-search-mobile" />
        </div>
      </div>

      <nav className="border-t border-border-subtle bg-surface">
        <ul className="no-scrollbar mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 sm:px-6">
          {NAV.map((item) => (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                className="inline-flex h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm font-medium text-muted transition-colors hover:bg-background hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
