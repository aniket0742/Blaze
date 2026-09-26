/**
 * Imports the catalog: real Indian products from Open Food Facts, priced in
 * rupees from real shop observations on Open Prices. Safe to re-run — it is a
 * full sync that upserts on barcode and removes what the sources no longer
 * support.
 *
 *   npm run db:seed               fetch, then write the database
 *   npm run db:seed -- --dry-run  fetch and report only; writes nothing
 *
 * Requires OFF_USER_AGENT, e.g. "Blaze/1.0 (you@example.com)" — both services
 * ask every client to identify itself.
 *
 * Rate limits. Open Food Facts allows 15 product reads a minute per IP and
 * answers 503 when pushed, so reads are paced and retried. Each product is
 * cached under node_modules/.cache, which makes an interrupted run resumable
 * and a repeat run fast. Delete that folder to force a fresh read.
 *
 * Licensing. Both sources are ODbL; product images are CC BY-SA. The app
 * attributes them — see DECISIONS.md.
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { notInArray, sql } from "drizzle-orm";
import { db } from "../lib/db";
import { categories, products } from "../lib/db/schema";
import {
  DEPARTMENTS,
  MAX_MRP_MULTIPLE,
  departmentSlug,
  hasPlausibleMrp,
  latestShelfPrice,
  toCatalogProduct,
  type CatalogProduct,
  type OffProduct,
  type PriceObservation,
  type Rejection,
} from "./catalog-source";

const OFF = "https://world.openfoodfacts.org";
const PRICES = "https://prices.openfoodfacts.org";
const CACHE = "node_modules/.cache/blaze-catalog/off";

/** Comfortably under Open Food Facts' 15 product reads per minute. */
const READ_INTERVAL_MS = 6_500;

const PRODUCT_FIELDS = [
  "code", "product_name", "product_name_en", "generic_name", "generic_name_en", "brands",
  "quantity", "product_quantity", "product_quantity_unit", "categories_tags",
  "image_front_url", "image_url", "image_ingredients_url", "image_nutrition_url",
  "image_packaging_url", "nutriscore_grade", "nova_group", "labels_tags", "allergens_tags",
  "ingredients_text", "ingredients_text_en", "nutriments", "nutrition_data_per",
  "unique_scans_n", "created_t",
].join(",");

const dryRun = process.argv.includes("--dry-run");

function userAgent(): string {
  const ua = process.env.OFF_USER_AGENT?.trim();
  if (!ua || !/\(.+@.+\)/.test(ua)) {
    throw new Error('OFF_USER_AGENT must be set, e.g. "Blaze/1.0 (you@example.com)". See .env.example.');
  }
  return ua;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * GET with the required User-Agent. 429 and 503 are rate-limit answers and
 * are retried with a growing wait; anything else that is not OK aborts the
 * import, so a flaky network can never produce a half-empty catalog.
 *
 * `notFoundIsAnAnswer`: the product API replies 404 with a JSON body when a
 * barcode is not a food product there. That is a definite answer about the
 * product, not a failure of the request, so the caller gets the body.
 */
async function getJson<T>(url: string, ua: string, { notFoundIsAnAnswer = false } = {}): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(url, { headers: { "User-Agent": ua, Accept: "application/json" } });
    if (res.ok) return (await res.json()) as T;
    if (res.status === 404 && notFoundIsAnAnswer) return (await res.json()) as T;
    if ((res.status === 429 || res.status === 503) && attempt < 5) {
      const wait = 30_000 * attempt;
      console.log(`    ${res.status} from ${new URL(url).host} — waiting ${wait / 1000}s (attempt ${attempt}/4)`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${res.statusText} for ${url}`);
  }
}

/**
 * Every rupee price for an Open Food Facts product. Paged by id, which is
 * unique. Paged by date, which many records share, a record on a page boundary
 * could be served twice and its neighbour never — and the sync deletes a
 * product whose only price was skipped. See DECISIONS.md.
 */
async function fetchPrices(ua: string): Promise<Map<string, PriceObservation[]>> {
  const byCode = new Map<string, PriceObservation[]>();
  const seen = new Set<number>();
  let total = 0;
  for (let page = 1; ; page += 1) {
    const url =
      `${PRICES}/api/v1/prices?currency=INR&type=PRODUCT&product__source=off` +
      `&order_by=-id&size=100&page=${page}`;
    const body = await getJson<{ items: PriceObservation[]; pages: number; total: number }>(url, ua);
    total = body.total;
    for (const o of body.items) {
      if (seen.has(o.id)) continue;
      seen.add(o.id);
      if (!o.product_code) continue;
      byCode.set(o.product_code, [...(byCode.get(o.product_code) ?? []), o]);
    }
    if (page >= body.pages || body.items.length === 0) break;
    await sleep(1_000);
  }
  // A record added or removed mid-read shifts the pages. Stop rather than
  // sync from an incomplete read.
  if (seen.size !== total) {
    throw new Error(`Read ${seen.size} of ${total} prices; the feed changed during the read. Run the import again.`);
  }
  return byCode;
}

type CachedRead = { found: true; product: OffProduct } | { found: false };

/** One product from the v3 API, which the docs recommend for new integrations. */
async function fetchProduct(code: string, ua: string, pace: { last: number }): Promise<CachedRead> {
  const file = `${CACHE}/${code}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, "utf8")) as CachedRead;

  const wait = pace.last + READ_INTERVAL_MS - Date.now();
  if (wait > 0) await sleep(wait);
  pace.last = Date.now();

  // result.id is "product_found", or a reason it is not — e.g. not found, or
  // found as a beauty or pet product, which is not part of a food catalog.
  const body = await getJson<{ status: string; result?: { id: string }; product?: OffProduct }>(
    `${OFF}/api/v3/product/${encodeURIComponent(code)}?fields=${PRODUCT_FIELDS}`,
    ua,
    { notFoundIsAnAnswer: true },
  );
  const read: CachedRead =
    body.result?.id === "product_found" && body.product
      ? { found: true, product: { ...body.product, code } }
      : { found: false };
  writeFileSync(file, JSON.stringify(read));
  return read;
}

/** Official English names for the departments, from the Open Food Facts taxonomy. */
async function fetchDepartmentNames(ua: string): Promise<Map<string, string>> {
  const url = `${OFF}/api/v2/taxonomy?tagtype=categories&tags=${DEPARTMENTS.join(",")}&fields=name&lc=en`;
  const body = await getJson<Record<string, { name?: { en?: string } }>>(url, ua);
  const names = new Map<string, string>();
  for (const tag of DEPARTMENTS) {
    const name = body[tag]?.name?.en;
    if (!name) throw new Error(`The taxonomy has no English name for ${tag}; refusing to invent one.`);
    names.set(tag, name);
  }
  return names;
}

async function main() {
  const ua = userAgent();
  mkdirSync(CACHE, { recursive: true });

  console.log("Fetching rupee prices from Open Prices…");
  const priced = await fetchPrices(ua);
  const shelf = new Map(
    [...priced.entries()]
      .map(([code, obs]) => [code, latestShelfPrice(obs)] as const)
      .filter((e): e is readonly [string, NonNullable<ReturnType<typeof latestShelfPrice>>] => e[1] !== null),
  );
  console.log(`  ${priced.size} products observed, ${shelf.size} with a usable shelf price`);
  const implausible = [...priced.values()].flat().filter((o) => !hasPlausibleMrp(o));
  if (implausible.length > 0) {
    console.log(
      `  ${implausible.length} rejected for a pre-discount price over ${MAX_MRP_MULTIPLE}× the price: ` +
        implausible.map((o) => `#${o.id} (₹${o.price} vs ₹${o.price_without_discount})`).join(", "),
    );
  }

  console.log("Reading products from Open Food Facts…");
  const pace = { last: 0 };
  const rows: CatalogProduct[] = [];
  const rejected: Record<Rejection | "not-found", number> = {
    "not-found": 0,
    "no-name": 0,
    "no-image": 0,
    "no-department": 0,
  };
  let done = 0;
  for (const [code, price] of shelf) {
    const read = await fetchProduct(code, ua, pace);
    done += 1;
    if (done % 25 === 0) console.log(`  ${done}/${shelf.size}`);
    if (!read.found) {
      rejected["not-found"] += 1;
      continue;
    }
    const row = toCatalogProduct(read.product, price);
    if (typeof row === "string") rejected[row] += 1;
    else rows.push(row);
  }

  const names = await fetchDepartmentNames(ua);
  const used = new Set(rows.map((r) => r.categorySlug));
  const categoryRows = DEPARTMENTS.filter((tag) => used.has(departmentSlug(tag))).map((tag) => {
    const slug = departmentSlug(tag);
    // The department's most-scanned product stands for it in the aisle directory.
    const hero = rows
      .filter((r) => r.categorySlug === slug)
      .sort((a, b) => (b.scanCount ?? 0) - (a.scanCount ?? 0))[0];
    return { slug, name: names.get(tag)!, heroImage: hero?.thumbnail ?? null };
  });

  console.log(`\nCatalog: ${rows.length} products in ${categoryRows.length} departments`);
  console.log(`Left out: ${JSON.stringify(rejected)}`);
  for (const c of categoryRows) {
    console.log(`  ${String(rows.filter((r) => r.categorySlug === c.slug).length).padStart(3)}  ${c.name}`);
  }

  if (dryRun) {
    console.log("\n--dry-run: nothing written.");
    process.exit(0);
  }
  if (rows.length === 0) throw new Error("The sources returned no usable products; refusing to empty the catalog.");

  const barcodes = rows.map((r) => r.barcode);
  const slugs = categoryRows.map((c) => c.slug);

  await db.transaction(async (tx) => {
    await tx
      .insert(categories)
      .values(categoryRows)
      // `excluded` is the row we tried to insert — see DECISIONS.md.
      .onConflictDoUpdate({
        target: categories.slug,
        set: { name: sql`excluded.name`, heroImage: sql`excluded.hero_image` },
      });

    await tx
      .insert(products)
      .values(rows)
      .onConflictDoUpdate({
        target: products.barcode,
        set: {
          slug: sql`excluded.slug`,
          title: sql`excluded.title`,
          description: sql`excluded.description`,
          categorySlug: sql`excluded.category_slug`,
          brand: sql`excluded.brand`,
          quantity: sql`excluded.quantity`,
          pricePaise: sql`excluded.price_paise`,
          mrpPaise: sql`excluded.mrp_paise`,
          priceObservedOn: sql`excluded.price_observed_on`,
          thumbnail: sql`excluded.thumbnail`,
          images: sql`excluded.images`,
          nutriscoreGrade: sql`excluded.nutriscore_grade`,
          novaGroup: sql`excluded.nova_group`,
          labels: sql`excluded.labels`,
          allergens: sql`excluded.allergens`,
          ingredientsText: sql`excluded.ingredients_text`,
          nutriments: sql`excluded.nutriments`,
          nutritionPer: sql`excluded.nutrition_per`,
          scanCount: sql`excluded.scan_count`,
          createdAt: sql`excluded.created_at`,
        },
      });

    // A product the sources no longer support is no longer sold. Deleting it
    // clears it from carts and nulls the link on past orders, whose snapshot
    // of title, price and image is untouched.
    await tx.delete(products).where(notInArray(products.barcode, barcodes));
    await tx.delete(categories).where(notInArray(categories.slug, slugs));
  });

  console.log("\nImport complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
