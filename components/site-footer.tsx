export function SiteFooter() {
  return (
    <footer className="mt-10 border-t border-border-subtle bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 text-[13px] text-muted sm:px-6">
        <p className="font-medium text-foreground">Blaze</p>
        <p className="mt-2 max-w-xl">
          A demo storefront built for an assignment. Catalog data comes from DummyJSON and prices are
          seeded demo values, not real listings or live exchange rates. Nothing here is for sale.
        </p>
      </div>
    </footer>
  );
}
