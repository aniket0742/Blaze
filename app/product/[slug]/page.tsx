import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ArrowIcon } from "@/components/icons";
import { NutriscoreScale } from "@/components/nutriscore-badge";
import { ProductGallery } from "@/components/product-gallery";
import { NutritionPanel, ProductIngredients } from "@/components/product-nutrition";
import { ProductSpecs } from "@/components/product-specs";
import { Eyebrow, Price } from "@/components/ui";
import { getAllProductSlugs, getCategory, getProductBySlug } from "@/lib/catalog";
import { formatCalendarDate } from "@/lib/format";

export const revalidate = 3600;

// Same treatment as category pages: prerender the catalog, and make anything
// outside it a real HTTP 404 rather than a not-found page served with a 200.
// Trade-off: a newly imported product needs a rebuild to become reachable.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  const summary = [product.brand, product.title, product.quantity].filter(Boolean).join(" · ");
  return {
    title: product.title,
    description: (product.description ?? summary).slice(0, 160),
    openGraph: { title: product.title, images: [product.thumbnail] },
  };
}

const sourceLink = "underline decoration-border-field underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground";

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const category = await getCategory(product.categorySlug);
  const categoryName = category?.name ?? product.categorySlug;
  const offUrl = `https://world.openfoodfacts.org/product/${product.barcode}`;
  const pricesUrl = `https://prices.openfoodfacts.org/products/${product.barcode}`;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-2 text-[13px] text-muted">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href={`/category/${product.categorySlug}`} className="hover:text-foreground">
              {categoryName}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="truncate text-foreground">
            {product.title}
          </li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <ProductGallery images={product.images} title={product.title} />

        <div className="lg:pt-4">
          {product.brand && <Eyebrow>{product.brand}</Eyebrow>}
          <h1 className="mt-2 font-display text-4xl leading-[1.02] tracking-tight sm:text-5xl">{product.title}</h1>
          {(product.description || product.quantity) && (
            <p className="mt-3 text-[16px] text-muted">
              {[product.description, product.quantity].filter(Boolean).join(" · ")}
            </p>
          )}

          {product.nutriscoreGrade && (
            <div className="mt-6">
              <NutriscoreScale grade={product.nutriscoreGrade} />
            </div>
          )}

          <div className="mt-6 border-y border-border-subtle py-5">
            <Price pricePaise={product.pricePaise} mrpPaise={product.mrpPaise} size="lg" />
            {/* Where the price comes from, stated next to the price itself. */}
            <p className="mt-2 text-[13px] text-muted">
              Shelf price seen in a shop on{" "}
              <span className="font-medium text-foreground">{formatCalendarDate(product.priceObservedOn)}</span>, via{" "}
              <a href={pricesUrl} className={sourceLink}>
                Open Prices
              </a>
              . Inclusive of all taxes.
            </p>
          </div>

          <div className="mt-6">
            <AddToCart productId={product.id} />
          </div>
        </div>
      </div>

      <div className="mt-16 grid gap-12 border-t border-foreground pt-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="inside">
          <h2 id="inside" className="font-display text-3xl tracking-tight">
            What&apos;s inside
          </h2>
          <div className="mt-5">
            <ProductIngredients product={product} />
          </div>
        </section>
        <section aria-labelledby="nutrition">
          <h2 id="nutrition" className="sr-only">
            Nutrition
          </h2>
          <NutritionPanel product={product} />
        </section>
      </div>

      <section aria-labelledby="details" className="mt-14">
        <h2 id="details" className="font-display text-3xl tracking-tight">
          Details
        </h2>
        <div className="mt-5 max-w-2xl">
          <ProductSpecs product={product} categoryName={categoryName} />
        </div>
      </section>

      {/* Required by the Open Food Facts terms of reuse: name the licence and
          link to the product's own page. See DECISIONS.md. */}
      <p className="mt-12 max-w-3xl text-[13px] leading-relaxed text-muted">
        Product information and images from{" "}
        <a href={offUrl} className={sourceLink}>
          Open Food Facts
        </a>{" "}
        (data under the Open Database License, images under CC BY-SA). Price from{" "}
        <a href={pricesUrl} className={sourceLink}>
          Open Prices
        </a>{" "}
        (Open Database License). Information is provided as-is and may be incomplete — check the pack.
      </p>

      <Link
        href={`/category/${product.categorySlug}`}
        className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium underline decoration-border-field underline-offset-4 hover:decoration-foreground"
      >
        More from {categoryName}
        <ArrowIcon />
      </Link>
    </div>
  );
}
