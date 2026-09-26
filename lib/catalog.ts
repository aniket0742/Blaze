import { count, desc, eq, gt, max, min, sql } from "drizzle-orm";
import { db } from "./db";
import { categories, products } from "./db/schema";

/** Cheapest and dearest item in the catalog, in paise — shown as guidance on
 *  the price filter so the inputs aren't a blind guess. */
export async function getPriceBounds() {
  const [row] = await db
    .select({ min: min(products.pricePaise), max: max(products.pricePaise) })
    .from(products);
  return { min: row?.min ?? 0, max: row?.max ?? 0 };
}

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

/** Products Open Food Facts users scan most — a real popularity signal,
 *  used for the home page rail. Id breaks ties so the order is stable. */
export async function getMostScannedProducts(limit: number) {
  return db
    .select()
    .from(products)
    .orderBy(desc(products.scanCount), desc(products.id))
    .limit(limit);
}

/** The discount as a fraction of the MRP, computed from the two stored prices. */
export const discountFraction = sql<number>`(${products.mrpPaise} - ${products.pricePaise})::float / ${products.mrpPaise}`;

/** Biggest real discounts — only products whose observed price was below a
 *  recorded MRP. Used for the home page deals. */
export async function getBestDeals(limit: number) {
  return db
    .select()
    .from(products)
    .where(gt(products.mrpPaise, products.pricePaise))
    .orderBy(desc(discountFraction), desc(products.id))
    .limit(limit);
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
    .orderBy(desc(products.scanCount), desc(products.id));
}

export async function getProductBySlug(slug: string) {
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return product ?? null;
}

/** Slugs for prerendering every product page. */
export async function getAllProductSlugs() {
  return db.select({ slug: products.slug }).from(products);
}
