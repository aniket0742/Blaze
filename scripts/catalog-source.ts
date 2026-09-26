/**
 * Pure mapping from Open Food Facts and Open Prices responses to catalog rows.
 * No network and no database, so every rule here is unit-tested — see
 * tests/catalog-source.test.ts. The fetching lives in scripts/seed.ts.
 *
 * The one rule behind all of it: a value either comes from the source or it
 * is null. Nothing is estimated, defaulted into existence, or invented.
 */
import type { Nutriments, products } from "../lib/db/schema";

/**
 * Store departments, as real Open Food Facts category tags, most specific
 * first. A product lands in the first one its own tags contain, so a chocolate
 * milkshake tagged both `en:dairies` and `en:beverages…` is filed under Dairies.
 * Choosing which tags are departments is merchandising; the tags themselves,
 * and their names, come from the Open Food Facts taxonomy.
 */
export const DEPARTMENTS = [
  "en:dairies",
  "en:beverages-and-beverages-preparations",
  "en:breakfast-cereals",
  "en:biscuits-and-cakes",
  "en:confectioneries",
  "en:salty-snacks",
  "en:desserts",
  "en:spreads",
  "en:condiments",
  "en:noodles",
  "en:fats",
  "en:sweeteners",
  "en:dietary-supplements",
  "en:cereals-and-their-products",
  "en:fruits-and-vegetables-based-foods",
  "en:snacks",
  "en:plant-based-foods-and-beverages",
] as const;

/** The subset of an Open Prices price item the import reads. */
export type PriceObservation = {
  id: number;
  type: string;
  product_code: string | null;
  price: number;
  price_is_discounted: boolean;
  price_without_discount: number | null;
  discount_type: string | null;
  price_per: string | null;
  currency: string | null;
  date: string;
  duplicate_of: number | null;
};

/**
 * Discounts that do not describe a normal shelf price for one new unit: a
 * clearance price, a second-hand price, or a per-unit price under a multi-buy.
 */
const NOT_A_SHELF_PRICE = new Set(["EXPIRES_SOON", "SECOND_HAND", "QUANTITY"]);

/**
 * The most a recorded pre-discount price may be, as a multiple of the price.
 * 10× is a 90% markdown; past that the figure is a placeholder or a typo, not
 * a discount. The largest real markdown in the data is 5.1×; the one record
 * past 10× has 9,999,999 as its pre-discount price. See DECISIONS.md.
 */
export const MAX_MRP_MULTIPLE = 10;

/** No pre-discount price, or one that a real markdown could explain. */
export function hasPlausibleMrp(o: PriceObservation): boolean {
  const mrp = o.price_without_discount;
  return mrp == null || mrp <= o.price * MAX_MRP_MULTIPLE;
}

export function isUsableObservation(o: PriceObservation): boolean {
  return (
    o.type === "PRODUCT" &&
    o.currency === "INR" &&
    Boolean(o.product_code) &&
    o.duplicate_of == null &&
    typeof o.price === "number" &&
    Number.isFinite(o.price) &&
    o.price > 0 &&
    // KILOGRAM prices are for loose goods sold by weight, not per item.
    (o.price_per == null || o.price_per === "" || o.price_per === "UNIT") &&
    !(o.discount_type && NOT_A_SHELF_PRICE.has(o.discount_type)) &&
    // The whole record goes, not just its MRP: a record with a placeholder in
    // one field is not trusted for its price either.
    hasPlausibleMrp(o)
  );
}

export type ShelfPrice = { pricePaise: number; mrpPaise: number; observedOn: string };

/**
 * The latest usable observation for one product. The MRP is the pre-discount
 * price the shopper recorded when there is one; otherwise it equals the price,
 * so no discount is shown that the shopper did not record.
 */
export function latestShelfPrice(observations: PriceObservation[]): ShelfPrice | null {
  const [latest] = observations
    .filter(isUsableObservation)
    .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
  if (!latest) return null;

  const pricePaise = Math.round(latest.price * 100);
  const wasDiscounted =
    latest.price_is_discounted &&
    typeof latest.price_without_discount === "number" &&
    latest.price_without_discount > latest.price;
  const mrpPaise = wasDiscounted ? Math.round(latest.price_without_discount! * 100) : pricePaise;

  return { pricePaise, mrpPaise, observedOn: latest.date };
}

/** The subset of an Open Food Facts v3 product the import reads. */
export type OffProduct = {
  code: string;
  product_name?: string;
  product_name_en?: string;
  generic_name?: string;
  generic_name_en?: string;
  brands?: string;
  quantity?: string;
  product_quantity?: number | string;
  product_quantity_unit?: string;
  categories_tags?: string[];
  image_front_url?: string;
  image_url?: string;
  image_ingredients_url?: string;
  image_nutrition_url?: string;
  image_packaging_url?: string;
  nutriscore_grade?: string;
  nova_group?: number;
  labels_tags?: string[];
  allergens_tags?: string[];
  ingredients_text?: string;
  ingredients_text_en?: string;
  nutriments?: Record<string, unknown>;
  nutrition_data_per?: string;
  unique_scans_n?: number;
  created_t?: number;
};

export function departmentFor(tags: string[] | undefined): string | null {
  if (!tags?.length) return null;
  return DEPARTMENTS.find((d) => tags.includes(d)) ?? null;
}

/** `en:dairies` → `dairies`. Department slugs are the tag, minus the language. */
export function departmentSlug(tag: string): string {
  return tag.replace(/^en:/, "");
}

export function slugify(title: string, barcode: string): string {
  const base = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return base ? `${base}-${barcode}` : barcode;
}

function text(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || null;
}

/**
 * Only images served from Open Food Facts' own image host. next.config.ts
 * allows exactly that host, and next/image throws at render for any other —
 * so an off-host URL is treated as no image rather than as a page that crashes.
 */
export const IMAGE_HOST = "images.openfoodfacts.org";

export function imageUrl(value: unknown): string | null {
  const url = text(value);
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.host === IMAGE_HOST ? url : null;
  } catch {
    return null;
  }
}

/** "180 ml" from the structured fields when both exist, else the free text. */
export function packSize(p: OffProduct): string | null {
  const n = Number(p.product_quantity);
  const unit = text(p.product_quantity_unit);
  if (Number.isFinite(n) && n > 0 && unit) return `${n} ${unit}`;
  return text(p.quantity);
}

const NUTRIENT_KEYS: [keyof Nutriments, string][] = [
  ["energyKcal", "energy-kcal_100g"],
  ["fat", "fat_100g"],
  ["saturatedFat", "saturated-fat_100g"],
  ["carbohydrates", "carbohydrates_100g"],
  ["sugars", "sugars_100g"],
  ["fiber", "fiber_100g"],
  ["proteins", "proteins_100g"],
  ["salt", "salt_100g"],
];

/** Only the nutrients the source actually reports, as numbers. Null if none. */
export function nutrition(p: OffProduct): { nutriments: Nutriments; per: "100g" | "100ml" } | null {
  const out: Nutriments = {};
  for (const [key, sourceKey] of NUTRIENT_KEYS) {
    const v = p.nutriments?.[sourceKey];
    if (typeof v === "number" && Number.isFinite(v) && v >= 0) out[key] = v;
  }
  if (Object.keys(out).length === 0) return null;
  return { nutriments: out, per: p.nutrition_data_per === "100ml" ? "100ml" : "100g" };
}

/** English tags only; a `fr:` label means nothing to a shopper in India. */
function englishTags(tags: string[] | undefined): string[] {
  return (tags ?? []).filter((t) => t.startsWith("en:"));
}

export type CatalogProduct = Omit<typeof products.$inferInsert, "id">;

export type Rejection = "no-name" | "no-image" | "no-department";

/**
 * One Open Food Facts product plus its shelf price, as a catalog row — or the
 * reason it cannot be one. A product without a name, an image or a department
 * is left out rather than given a made-up one.
 */
export function toCatalogProduct(
  p: OffProduct,
  price: ShelfPrice,
  now: Date = new Date(),
): CatalogProduct | Rejection {
  const title = text(p.product_name_en) ?? text(p.product_name);
  if (!title) return "no-name";

  const thumbnail = imageUrl(p.image_front_url) ?? imageUrl(p.image_url);
  if (!thumbnail) return "no-image";

  const department = departmentFor(p.categories_tags);
  if (!department) return "no-department";

  const images = [
    ...new Set(
      [thumbnail, p.image_ingredients_url, p.image_nutrition_url, p.image_packaging_url]
        .map(imageUrl)
        .filter((u): u is string => u !== null),
    ),
  ];
  const grade = text(p.nutriscore_grade)?.toLowerCase();
  const facts = nutrition(p);

  return {
    barcode: p.code,
    slug: slugify(title, p.code),
    title,
    description: text(p.generic_name_en) ?? text(p.generic_name),
    categorySlug: departmentSlug(department),
    brand: text(p.brands?.split(",")[0]),
    quantity: packSize(p),
    pricePaise: price.pricePaise,
    mrpPaise: price.mrpPaise,
    priceObservedOn: price.observedOn,
    thumbnail,
    images,
    nutriscoreGrade: grade && /^[a-e]$/.test(grade) ? grade : null,
    novaGroup:
      Number.isInteger(p.nova_group) && p.nova_group! >= 1 && p.nova_group! <= 4
        ? p.nova_group!
        : null,
    labels: englishTags(p.labels_tags),
    allergens: englishTags(p.allergens_tags),
    ingredientsText: text(p.ingredients_text_en) ?? text(p.ingredients_text),
    nutriments: facts?.nutriments ?? null,
    nutritionPer: facts?.per ?? null,
    scanCount: Number.isInteger(p.unique_scans_n) ? p.unique_scans_n! : 0,
    // When it entered Open Food Facts; if the source omits it, when it entered
    // this catalog — both are true statements about the product.
    createdAt: Number.isFinite(p.created_t) ? new Date(p.created_t! * 1000) : now,
  };
}
