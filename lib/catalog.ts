import { count, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { categories, products } from "./db/schema";

export async function getCategoriesWithCounts() {
  return db
    .select({
      slug: categories.slug,
      name: categories.name,
      heroImage: categories.heroImage,
      productCount: count(products.id),
    })
    .from(categories)
    .leftJoin(products, eq(products.categorySlug, categories.slug))
    .groupBy(categories.slug, categories.name, categories.heroImage)
    .orderBy(categories.name);
}

/** Highest-rated products, used for the home page rail. */
export async function getTopRatedProducts(limit: number) {
  return db.select().from(products).orderBy(desc(products.rating)).limit(limit);
}

/** Biggest discounts, used for the home page deals rail. */
export async function getBestDeals(limit: number) {
  return db.select().from(products).orderBy(desc(products.discountPercentage)).limit(limit);
}

/** Most recently added products, used for the New Arrivals rail. */
export async function getNewArrivals(limit: number) {
  return db.select().from(products).orderBy(desc(products.createdAt)).limit(limit);
}

export async function getCategory(slug: string) {
  const [category] = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  return category ?? null;
}

export async function getProductsByCategory(slug: string) {
  return db
    .select()
    .from(products)
    .where(eq(products.categorySlug, slug))
    .orderBy(desc(products.rating));
}
