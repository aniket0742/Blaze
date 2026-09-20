import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/add-to-cart";
import { ProductGallery } from "@/components/product-gallery";
import { ProductReviews } from "@/components/product-reviews";
import { ProductSpecs } from "@/components/product-specs";
import { RatingStars } from "@/components/rating-stars";
import { StockBadge } from "@/components/stock-badge";
import { getAllProductSlugs, getCategory, getProductBySlug, getProductReviews } from "@/lib/catalog";
import { deliveryEstimate, discountLabel, formatPrice } from "@/lib/format";

export const revalidate = 3600;

// Same treatment as category pages: prerender the catalog, and make anything
// outside it a real HTTP 404 rather than a not-found page served with a 200.
// Trade-off: a newly seeded product needs a rebuild to become reachable.
export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getAllProductSlugs()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.title,
    description: product.description.slice(0, 160),
    openGraph: { title: product.title, images: [product.thumbnail] },
  };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border-subtle bg-background p-4 shadow-card sm:p-5">
      <h2 className="mb-3 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </section>
  );
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [category, reviews] = await Promise.all([
    getCategory(product.categorySlug),
    getProductReviews(product.id),
  ]);

  const categoryName = category?.name ?? product.categorySlug;
  const hasDiscount = product.discountPercentage >= 1;
  // Some catalog rows ship an empty image array; the thumbnail always exists.
  const images = product.images.length > 0 ? product.images : [product.thumbnail];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <nav className="text-sm text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <Link href={`/category/${product.categorySlug}`} className="hover:text-foreground">
          {categoryName}
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="mt-4 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <ProductGallery images={images} title={product.title} />

        {/* Price, delivery and Add to Cart all sit above the fold on mobile. */}
        <div className="lg:max-w-lg">
          <p className="text-[12px] font-medium uppercase tracking-wide text-muted">
            {product.brand ?? "Blaze Marketplace"}
          </p>
          <h1 className="mt-1 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {product.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
            <RatingStars rating={product.rating} className="text-base" />
            <span className="font-medium">{product.rating.toFixed(1)}</span>
            <a href="#reviews" className="text-muted underline-offset-2 hover:underline">
              {product.reviewCount} {product.reviewCount === 1 ? "review" : "reviews"}
            </a>
          </div>

          <div className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-3xl font-semibold tracking-tight">
              {formatPrice(product.pricePaise)}
            </span>
            {hasDiscount && (
              <>
                <span className="text-sm text-muted line-through">
                  {formatPrice(product.mrpPaise)}
                </span>
                <span className="rounded-md bg-brand-600 px-1.5 py-0.5 text-[12px] font-semibold text-white">
                  {discountLabel(product.discountPercentage)}
                </span>
              </>
            )}
          </div>
          <p className="mt-1 text-[12px] text-muted">Inclusive of all taxes</p>

          <div className="mt-3">
            <StockBadge status={product.availabilityStatus} stock={product.stock} />
          </div>

          <dl className="mt-4 space-y-1.5 rounded-xl border border-border-subtle bg-surface px-4 py-3 text-[13px]">
            <div className="flex gap-2">
              <dt className="text-muted">Delivery</dt>
              <dd className="font-medium">
                {deliveryEstimate(product.shippingInformation)}
                <span className="font-normal text-muted"> · {product.shippingInformation}</span>
              </dd>
            </div>
            {product.returnPolicy && (
              <div className="flex gap-2">
                <dt className="text-muted">Returns</dt>
                <dd className="font-medium">{product.returnPolicy}</dd>
              </div>
            )}
            {product.warrantyInformation && (
              <div className="flex gap-2">
                <dt className="text-muted">Warranty</dt>
                <dd className="font-medium">{product.warrantyInformation}</dd>
              </div>
            )}
          </dl>

          <div className="mt-5">
            <AddToCart productId={product.id} stock={product.stock} />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <Card title="About this item">
          <p className="text-sm leading-relaxed text-muted">{product.description}</p>
        </Card>
        <Card title="Product details">
          <ProductSpecs product={product} categoryName={categoryName} />
        </Card>
      </div>

      <div id="reviews" className="mt-4 scroll-mt-36">
        <Card title="Ratings and reviews">
          <ProductReviews reviews={reviews} rating={product.rating} />
        </Card>
      </div>
    </div>
  );
}
