/**
 * Seeds the catalog from DummyJSON. Safe to re-run: products and categories
 * are upserted by primary key, reviews are replaced wholesale.
 *
 * Run with: npm run db:seed
 */
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
    .onConflictDoUpdate({
      target: categories.slug,
      set: { name: categories.name, heroImage: categories.heroImage },
    });
  console.log("  categories upserted");

  const rows = items.map((p) => ({
    id: p.id,
    slug: slugify(p.title, p.id),
    title: p.title,
    description: p.description,
    categorySlug: p.category,
    brand: p.brand ?? null,
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
  }));

  await db
    .insert(products)
    .values(rows)
    .onConflictDoUpdate({
      target: products.id,
      set: {
        slug: products.slug,
        title: products.title,
        description: products.description,
        categorySlug: products.categorySlug,
        brand: products.brand,
        pricePaise: products.pricePaise,
        mrpPaise: products.mrpPaise,
        discountPercentage: products.discountPercentage,
        rating: products.rating,
        reviewCount: products.reviewCount,
        stock: products.stock,
        availabilityStatus: products.availabilityStatus,
        thumbnail: products.thumbnail,
        images: products.images,
        tags: products.tags,
        shippingInformation: products.shippingInformation,
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
