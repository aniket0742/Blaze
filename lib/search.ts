import { and, asc, count, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "./db";
import { products } from "./db/schema";
import { PAGE_SIZE, type SearchQuery } from "./search-params";

/** `%` and `_` are ILIKE wildcards; a shopper typing them means the literal. */
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

function buildWhere(q: SearchQuery): SQL | undefined {
  const conditions: SQL[] = [];

  if (q.q) {
    const term = `%${escapeLike(q.q)}%`;
    conditions.push(
      or(
        ilike(products.title, term),
        ilike(products.description, term),
        ilike(products.brand, term),
        ilike(products.categorySlug, term),
        sql`${products.tags}::text ilike ${term}`,
      )!,
    );
  }
  if (q.category) conditions.push(eq(products.categorySlug, q.category));
  if (q.minPrice !== null) conditions.push(gte(products.pricePaise, Math.round(q.minPrice * 100)));
  if (q.maxPrice !== null) conditions.push(lte(products.pricePaise, Math.round(q.maxPrice * 100)));
  if (q.minRating !== null) conditions.push(gte(products.rating, q.minRating));

  return conditions.length ? and(...conditions) : undefined;
}

/**
 * Relevance is a simple field-priority score: a title that starts with the
 * term beats a title that merely contains it, which beats a brand or category
 * match, which beats a description-only hit. Ties break on rating.
 */
function orderFor(q: SearchQuery): SQL[] {
  switch (q.sort) {
    case "price-asc":
      return [asc(products.pricePaise)];
    case "price-desc":
      return [desc(products.pricePaise)];
    case "rating":
      return [desc(products.rating)];
    case "newest":
      return [desc(products.createdAt)];
    case "discount":
      return [desc(products.discountPercentage)];
    default: {
      if (!q.q) return [desc(products.rating)];
      const prefix = `${escapeLike(q.q)}%`;
      const term = `%${escapeLike(q.q)}%`;
      return [
        sql`case
          when ${products.title} ilike ${prefix} then 0
          when ${products.title} ilike ${term} then 1
          when ${products.brand} ilike ${term} then 2
          when ${products.categorySlug} ilike ${term} then 3
          else 4 end`,
        desc(products.rating),
      ];
    }
  }
}

export async function searchProducts(q: SearchQuery) {
  const where = buildWhere(q);

  const [{ value: total }] = await db.select({ value: count() }).from(products).where(where);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(q.page, pageCount);

  const items = await db
    .select()
    .from(products)
    .where(where)
    .orderBy(...orderFor(q))
    .limit(PAGE_SIZE)
    .offset((page - 1) * PAGE_SIZE);

  return { items, total, page, pageCount };
}
