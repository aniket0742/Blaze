import { and, asc, count, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { discountFraction } from "./catalog";
import { db } from "./db";
import { products } from "./db/schema";
import { PAGE_SIZE, gradesUpTo, type SearchQuery } from "./search-params";

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
        sql`${products.labels}::text ilike ${term}`,
      )!,
    );
  }
  if (q.category) conditions.push(eq(products.categorySlug, q.category));
  if (q.minPrice !== null) conditions.push(gte(products.pricePaise, Math.round(q.minPrice * 100)));
  if (q.maxPrice !== null) conditions.push(lte(products.pricePaise, Math.round(q.maxPrice * 100)));
  if (q.nutriscore !== null) conditions.push(inArray(products.nutriscoreGrade, gradesUpTo(q.nutriscore)));

  return conditions.length ? and(...conditions) : undefined;
}

/**
 * Relevance is a simple field-priority score: a title that starts with the
 * term beats a title that merely contains it, which beats a brand or category
 * match, which beats a description-only hit. Ties break on how often the
 * product is scanned on Open Food Facts.
 */
function orderFor(q: SearchQuery): SQL[] {
  switch (q.sort) {
    case "price-asc":
      return [asc(products.pricePaise)];
    case "price-desc":
      return [desc(products.pricePaise)];
    case "nutriscore":
      // "a" sorts before "e"; products without a grade go last, not first.
      return [sql`${products.nutriscoreGrade} asc nulls last`, desc(products.scanCount)];
    case "popular":
      return [desc(products.scanCount), desc(products.id)];
    case "newest":
      return [desc(products.createdAt)];
    case "discount":
      return [desc(discountFraction), desc(products.scanCount)];
    default: {
      if (!q.q) return [desc(products.scanCount), desc(products.id)];
      const prefix = `${escapeLike(q.q)}%`;
      const term = `%${escapeLike(q.q)}%`;
      return [
        sql`case
          when ${products.title} ilike ${prefix} then 0
          when ${products.title} ilike ${term} then 1
          when ${products.brand} ilike ${term} then 2
          when ${products.categorySlug} ilike ${term} then 3
          else 4 end`,
        desc(products.scanCount),
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
