/**
 * Seeds the catalog from DummyJSON. Safe to re-run: products and categories
 * are upserted by primary key, reviews are replaced wholesale.
 *
 * Run with: npm run db:seed
 */
import { sql } from "drizzle-orm";
import { db } from "../lib/db";
import { categories, productReviews, products } from "../lib/db/schema";

/** Fixed demo conversion rate. Not a live FX rate — see DECISIONS.md. */
const USD_TO_INR = 85;

type DummyProduct = {
  id: number;
  title: string;
  description: string;
  category: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  tags: string[];
  brand?: string;
  sku: string;
  weight: number;
  dimensions: { width: number; height: number; depth: number };
  warrantyInformation: string;
  shippingInformation: string;
  availabilityStatus: string;
  returnPolicy: string;
  images: string[];
  thumbnail: string;
  meta: { createdAt: string };
  reviews: { rating: number; comment: string; date: string; reviewerName: string }[];
};

function toPaise(usd: number): number {
  return Math.round(usd * USD_TO_INR * 100);
}

/** DummyJSON's price is post-discount, so the pre-discount MRP is derived. */
function mrpPaise(usd: number, discountPercentage: number): number {
  const mrp = usd / (1 - discountPercentage / 100);
  return Math.round(mrp * USD_TO_INR * 100);
}

/**
 * DummyJSON ships one product branded "Amazon", whose description also names
 * Alexa. The brief forbids using the Amazon name, so it is renamed here rather
 * than patched in the database — a reseed would otherwise bring it back.
 * Everything else about the product (price, rating, stock, reviews, imagery)
 * is left exactly as the source has it.
 */
const RENAMED: Record<number, { title: string; brand: string; description: string }> = {
  99: {
    title: "Smart Speaker with Voice Assistant",
    brand: "Blaze Audio",
    description:
      "A smart speaker with built-in voice control. It features premium sound quality and serves as a hub for controlling smart home devices.",
  },
};

function slugify(title: string, id: number): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${base}-${id}`;
}

async function main() {
  console.log("Fetching catalog from DummyJSON…");
  const [catRes, prodRes] = await Promise.all([
    fetch("https://dummyjson.com/products/categories"),
    fetch("https://dummyjson.com/products?limit=0"),
  ]);
  if (!catRes.ok || !prodRes.ok) throw new Error("DummyJSON fetch failed");

  const categoryList: { slug: string; name: string }[] = await catRes.json();
  const { products: items }: { products: DummyProduct[] } = await prodRes.json();
  console.log(`  ${categoryList.length} categories, ${items.length} products`);

  // First product thumbnail in each category doubles as its hero image.
  const heroBySlug = new Map<string, string>();
  for (const p of items) if (!heroBySlug.has(p.category)) heroBySlug.set(p.category, p.thumbnail);

  await db
    .insert(categories)
    .values(
      categoryList.map((c) => ({
        slug: c.slug,
        name: c.name,
        heroImage: heroBySlug.get(c.slug) ?? null,
      })),
    )
    // `excluded` is the row we tried to insert. Referencing the table columns
    // here instead would set each column to its own existing value — a no-op.
    .onConflictDoUpdate({
      target: categories.slug,
      set: { name: sql`excluded.name`, heroImage: sql`excluded.hero_image` },
    });
  console.log("  categories upserted");

  const rows = items.map((p) => {
    const renamed = RENAMED[p.id];
    const title = renamed?.title ?? p.title;
    return {
      id: p.id,
      slug: slugify(title, p.id),
      title,
      description: renamed?.description ?? p.description,
      categorySlug: p.category,
      brand: renamed?.brand ?? p.brand ?? null,
      pricePaise: toPaise(p.price),
      mrpPaise: mrpPaise(p.price, p.discountPercentage),
      discountPercentage: p.discountPercentage,
      rating: p.rating,
      reviewCount: p.reviews.length,
      stock: p.stock,
      availabilityStatus: p.availabilityStatus,
      sku: p.sku,
      thumbnail: p.thumbnail,
      images: p.images,
      tags: p.tags,
      weightGrams: p.weight,
      dimensions: p.dimensions,
      warrantyInformation: p.warrantyInformation,
      shippingInformation: p.shippingInformation,
      returnPolicy: p.returnPolicy,
      createdAt: new Date(p.meta.createdAt),
    };
  });

  await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        slug: sql`excluded.slug`,
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        categorySlug: sql`excluded.category_slug`,
        brand: sql`excluded.brand`,
        pricePaise: sql`excluded.price_paise`,
        mrpPaise: sql`excluded.mrp_paise`,
        discountPercentage: sql`excluded.discount_percentage`,
        rating: sql`excluded.rating`,
        reviewCount: sql`excluded.review_count`,
        stock: sql`excluded.stock`,
        availabilityStatus: sql`excluded.availability_status`,
        thumbnail: sql`excluded.thumbnail`,
        images: sql`excluded.images`,
        tags: sql`excluded.tags`,
        shippingInformation: sql`excluded.shipping_information`,
        createdAt: sql`excluded.created_at`,
      },
    });
  console.log("  products upserted");

  await db.delete(productReviews);
  await db.insert(productReviews).values(
    items.flatMap((p) =>
      p.reviews.map((r) => ({
        productId: p.id,
        rating: r.rating,
        comment: r.comment,
        reviewerName: r.reviewerName,
        reviewedAt: new Date(r.date),
      })),
    ),
  );
  console.log("  reviews replaced");

  console.log("Seed complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
