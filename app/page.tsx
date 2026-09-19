import Link from "next/link";
import { AzIndex } from "@/components/az-index";
import { CategoryCard } from "@/components/category-card";
import { ProductCard } from "@/components/product-card";
import { Section } from "@/components/section";
import { getBestDeals, getCategoriesWithCounts, getTopRatedProducts } from "@/lib/catalog";

export const revalidate = 3600;

export default async function HomePage() {
  const [categories, topRated, deals] = await Promise.all([
    getCategoriesWithCounts(),
    getTopRatedProducts(10),
    getBestDeals(10),
  ]);

  const popular = [...categories].sort((a, b) => b.productCount - a.productCount).slice(0, 8);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <section className="py-12 sm:py-20">
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
          Everything you need.
          <br />
          <span className="text-brand-500">A to Z.</span>
        </h1>
        <p className="mt-5 max-w-xl text-base text-muted sm:text-lg">
          {categories.length} categories, priced honestly. Delivery dates and the full price are on
          every card — no surprises three screens later.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="#browse"
            className="rounded-full bg-brand-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            Browse A–Z
          </Link>
          <Link
            href="#deals"
            className="rounded-full border border-border-subtle px-6 py-3 text-sm font-medium transition-colors hover:bg-surface"
          >
            See today&apos;s deals
          </Link>
        </div>
      </section>

      <Section title="Shop by category" description="The eight categories we stock most deeply.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {popular.map((c) => (
            <CategoryCard key={c.slug} {...c} />
          ))}
        </div>
      </Section>

      <Section title="Top rated" description="Highest customer ratings across the catalog.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {topRated.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <Section id="deals" title="Best deals" description="Largest discounts off list price.">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {deals.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </Section>

      <Section
        id="browse"
        title="Browse A–Z"
        description="Every category we carry, alphabetically."
      >
        <AzIndex categories={categories} />
      </Section>
    </div>
  );
}
