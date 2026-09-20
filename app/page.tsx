import { AzIndex } from "@/components/az-index";
import { AzPromo } from "@/components/az-promo";
import { CategoryStrip } from "@/components/category-strip";
import { DealStripCard } from "@/components/deal-strip-card";
import { DealsModule } from "@/components/deals-module";
import { ProductCard } from "@/components/product-card";
import { ProductRail } from "@/components/product-rail";
import { Section } from "@/components/section";
import {
  getBestDeals,
  getCategoriesWithCounts,
  getNewArrivals,
  getTopRatedProducts,
} from "@/lib/catalog";

export const revalidate = 3600;

export default async function HomePage() {
  const [categories, deals, topRated, newArrivals] = await Promise.all([
    getCategoriesWithCounts(),
    getBestDeals(7),
    getTopRatedProducts(12),
    getNewArrivals(12),
  ]);

  const moduleDeals = deals.slice(0, 4);
  const stripDeals = deals.slice(4, 7);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6">
      {/* Heaviest band on the page: a wide deals module beside a 2×2 of short
          cards. Different widths, different visual weights. */}
      <div id="deals" className="grid scroll-mt-36 gap-4 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <DealsModule products={moduleDeals} />
        </div>

        {/* The right half is a 2×2 of short cards rather than two full-height
            ones. The promo takes a single quarter; deals fill the rest. */}
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2 lg:grid-rows-2">
          {stripDeals.map((p) => (
            <DealStripCard key={p.id} product={p} />
          ))}
          <AzPromo categoryCount={categories.length} />
        </div>
      </div>

      <Section
        id="categories"
        title={`Shop across ${categories.length} categories`}
        description="Every category we carry, with live item counts."
      >
        <CategoryStrip categories={categories} />
      </Section>

      <Section
        id="top-rated"
        card
        title="Top rated"
        description="Highest customer ratings across the catalog."
        href="/search?sort=rating"
        hrefLabel="View all"
      >
        <ProductRail products={topRated} />
      </Section>

      <Section
        id="new"
        title="New arrivals"
        description="Most recently added to the marketplace."
        href="/search?sort=newest"
        hrefLabel="View all"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {newArrivals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <Section id="browse" card title="Browse A–Z" description="Jump to any category by letter.">
        <AzIndex categories={categories} />
      </Section>
    </div>
  );
}
