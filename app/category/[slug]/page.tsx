import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ProductCard } from "@/components/product-card";
import { getCategoriesWithCounts, getCategory, getProductsByCategory } from "@/lib/catalog";

export const revalidate = 3600;

// Only 24 categories, so prerender them all rather than hitting the database
// on every request. dynamicParams: false makes anything outside that set a real
// HTTP 404 — without it Next serves the not-found page with a 200 status.
// Trade-off: a newly seeded category needs a rebuild to become reachable.
export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getCategoriesWithCounts();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Shop ${category.name} on Blaze, with delivery dates and full prices shown up front.`,
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const items = await getProductsByCategory(slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-muted">
        <Link href="/" className="hover:text-foreground">
          Home
        </Link>
        <span className="mx-2" aria-hidden>
          /
        </span>
        <span className="text-foreground">{category.name}</span>
      </nav>

      <header className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{category.name}</h1>
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "item" : "items"}, sorted by rating
        </p>
      </header>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="Nothing in this category yet"
            description="We don't stock anything here right now. Browse the full A–Z index to see what we do carry."
            actionHref="/#browse"
            actionLabel="Browse A–Z"
          />
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {items.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
