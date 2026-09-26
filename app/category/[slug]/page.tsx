import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/empty-state";
import { ProductGrid } from "@/components/product-grid";
import { PageTitle } from "@/components/ui";
import { getCategoriesWithCounts, getCategory, getProductsByCategory } from "@/lib/catalog";

export const revalidate = 3600;

// A few dozen categories at most, so prerender them all rather than hitting
// the database on every request. dynamicParams: false makes anything outside
// that set a real HTTP 404 — without it Next serves the not-found page with a
// 200. Trade-off: a newly imported category needs a rebuild to become reachable.
export const dynamicParams = false;

export async function generateStaticParams() {
  const categories = await getCategoriesWithCounts();
  return categories.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) return { title: "Category not found" };
  return {
    title: category.name,
    description: `Shop ${category.name} on Blaze, with real shelf prices and Nutri-Scores shown up front.`,
  };
}

export default async function CategoryPage({ params }: PageProps<"/category/[slug]">) {
  const { slug } = await params;
  const category = await getCategory(slug);
  if (!category) notFound();

  const [items, aisles] = await Promise.all([getProductsByCategory(slug), getCategoriesWithCounts()]);
  // The same alphabetical numbering the aisle directory uses.
  const number = [...aisles].sort((a, b) => a.name.localeCompare(b.name)).findIndex((a) => a.slug === slug) + 1;
  const graded = items.filter((p) => p.nutriscoreGrade).length;

  return (
    <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-[13px] text-muted">
          <li>
            <Link href="/" className="hover:text-foreground">
              Home
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li>
            <Link href="/#aisles" className="hover:text-foreground">
              Aisles
            </Link>
          </li>
        </ol>
      </nav>

      <div className="mt-6 border-b border-foreground pb-8">
        <PageTitle eyebrow={`Aisle ${String(number).padStart(2, "0")}`} title={category.name}>
          <p>
            {items.length} {items.length === 1 ? "product" : "products"}, most scanned first
            {graded > 0 && ` · ${graded} with a Nutri-Score`}.{" "}
            <Link
              href={`/search?category=${slug}`}
              className="text-foreground underline decoration-border-field underline-offset-2 hover:decoration-foreground"
            >
              Filter and sort this aisle
            </Link>
          </p>
        </PageTitle>
      </div>

      <div className="mt-8">
        {items.length === 0 ? (
          <EmptyState
            title="Nothing on this shelf yet"
            description="We don't stock anything here right now. The full aisle directory shows what we do carry."
            actionHref="/#aisles"
            actionLabel="See every aisle"
          />
        ) : (
          <ProductGrid products={items} dense />
        )}
      </div>
    </div>
  );
}
