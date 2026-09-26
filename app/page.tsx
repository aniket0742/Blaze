import Image from "next/image";
import Link from "next/link";
import { AisleDirectory } from "@/components/aisle-directory";
import { NutriscoreGuide } from "@/components/nutriscore-guide";
import { ProductGrid } from "@/components/product-grid";
import { RankedList } from "@/components/ranked-list";
import { Section } from "@/components/section";
import { Eyebrow, button } from "@/components/ui";
import {
  getBestDeals,
  getCategoriesWithCounts,
  getMostScannedProducts,
  getNewArrivals,
} from "@/lib/catalog";

export const revalidate = 3600;

/** What Blaze is, in three facts — each true of every product in the catalog. */
const PRINCIPLES = [
  { n: "01", title: "Real products", body: "Every product is an entry in Open Food Facts, with its own pack shot, ingredients and nutrition." },
  { n: "02", title: "Real prices", body: "Every price was seen in a real shop and recorded on Open Prices, with the date it was seen." },
  { n: "03", title: "Nothing invented", body: "No star ratings, no stock counts, no delivery promises — only what the sources actually say." },
];

export default async function HomePage() {
  const [aisles, deals, mostScanned, newArrivals] = await Promise.all([
    getCategoriesWithCounts(),
    getBestDeals(8),
    getMostScannedProducts(8),
    getNewArrivals(8),
  ]);
  const productCount = aisles.reduce((n, a) => n + a.productCount, 0);
  const cover = mostScanned.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      {/* The masthead. */}
      <section className="grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:py-20">
        <div>
          <Eyebrow>
            Everything, A to Z · {productCount} products · {aisles.length} aisles
          </Eyebrow>
          <h1 className="mt-4 font-display text-[2.75rem] leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
            Real groceries, at <span className="italic text-brand-600">real shelf prices.</span>
          </h1>
          <p className="mt-5 max-w-xl text-[16px] leading-relaxed text-muted">
            Blaze is a storefront of real Indian groceries, at prices shoppers photographed on real shop
            shelves. Every product comes from Open Food Facts, every price from Open Prices — with the
            Nutri-Score up front.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="#aisles" className={button("primary", "lg")}>
              Browse the aisles
            </Link>
            <Link href="/search?sort=discount" className={button("secondary", "lg")}>
              See the price watch
            </Link>
          </div>
        </div>

        {/* The cover: the four most-scanned packs, as a still life. */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4" aria-label="The four most-scanned products">
          {cover.map((p, i) => (
            <li key={p.id} className={i % 2 === 1 ? "translate-y-6 sm:translate-y-10" : ""}>
              <Link href={`/product/${p.slug}`} className="group block">
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-surface">
                  <Image
                    src={p.thumbnail}
                    alt={p.title}
                    fill
                    priority={i < 2}
                    sizes="(max-width: 1024px) 45vw, 260px"
                    className="object-contain p-6 mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                </div>
                <p className="mt-2 flex items-baseline gap-2 text-[13px]">
                  <span className="font-mono text-muted">{String(i + 1).padStart(2, "0")}</span>
                  <span className="truncate group-hover:underline group-hover:underline-offset-2">{p.title}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ul className="grid gap-6 border-y border-border-subtle py-8 sm:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <li key={p.n} className="flex gap-4">
            <span aria-hidden className="font-mono text-[13px] text-brand-600">
              {p.n}
            </span>
            <div>
              <h2 className="font-display text-xl tracking-tight">{p.title}</h2>
              <p className="mt-1 text-[14px] leading-relaxed text-muted">{p.body}</p>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-16 space-y-20">
        {deals.length > 0 && (
          <Section
            id="price-watch"
            index="01"
            title="Price watch"
            dek="The biggest real savings — shelf prices seen below the MRP printed on the pack."
            href="/search?sort=discount"
            hrefLabel="All savings"
          >
            <ProductGrid products={deals} />
          </Section>
        )}

        <Section
          id="most-scanned"
          index="02"
          title="Most scanned"
          dek="The products people scan most on Open Food Facts."
          href="/search?sort=popular"
          hrefLabel="The full chart"
        >
          <RankedList products={mostScanned} />
        </Section>

        <Section
          id="aisles"
          index="03"
          title="The aisles"
          dek={`Every department we stock, A to Z — ${aisles.length} aisles, each a real Open Food Facts category.`}
        >
          <AisleDirectory aisles={aisles} />
        </Section>

        <Section
          id="new"
          index="04"
          title="New to the shelf"
          dek="The products most recently added to Open Food Facts."
          href="/search?sort=newest"
          hrefLabel="Everything new"
        >
          <ProductGrid products={newArrivals} />
        </Section>

        <NutriscoreGuide />
      </div>
    </div>
  );
}
