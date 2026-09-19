import Link from "next/link";
import { Wordmark } from "./brand";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Wordmark />
        <nav className="flex items-center gap-1 text-sm font-medium">
          <Link
            href="/#browse"
            className="rounded-full px-3 py-2 text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Browse A–Z
          </Link>
          <Link
            href="/category/laptops"
            className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:bg-surface hover:text-foreground sm:inline-flex"
          >
            Laptops
          </Link>
          <Link
            href="/category/smartphones"
            className="hidden rounded-full px-3 py-2 text-muted transition-colors hover:bg-surface hover:text-foreground sm:inline-flex"
          >
            Smartphones
          </Link>
        </nav>
      </div>
    </header>
  );
}
