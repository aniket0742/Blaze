export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-border-subtle bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 text-sm text-muted sm:px-6">
        <p className="font-medium text-foreground">Blaze</p>
        <p className="mt-2 max-w-xl">
          A demo storefront built for an assignment. Catalog data comes from DummyJSON and prices are
          seeded demo values, not real listings or live exchange rates. Nothing here is for sale.
        </p>
      </div>
    </footer>
  );
}
