/**
 * Unit tests for the catalog import's pure rules — which prices are trusted,
 * which products get in, and what is left null rather than invented.
 * Run with `npm test`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  departmentFor,
  departmentSlug,
  imageUrl,
  isUsableObservation,
  latestShelfPrice,
  nutrition,
  packSize,
  slugify,
  toCatalogProduct,
  type OffProduct,
  type PriceObservation,
} from "../scripts/catalog-source";

function obs(patch: Partial<PriceObservation> = {}): PriceObservation {
  return {
    id: 1,
    type: "PRODUCT",
    product_code: "8901234567890",
    price: 120,
    price_is_discounted: false,
    price_without_discount: null,
    discount_type: null,
    price_per: null,
    currency: "INR",
    date: "2025-09-13",
    duplicate_of: null,
    ...patch,
  };
}

const PRICE = { pricePaise: 12000, mrpPaise: 12000, observedOn: "2025-09-13" };

function off(patch: Partial<OffProduct> = {}): OffProduct {
  return {
    code: "8901234567890",
    product_name: "Chocolate Milk Shake",
    image_front_url: "https://images.openfoodfacts.org/front.jpg",
    categories_tags: ["en:beverages-and-beverages-preparations", "en:dairies"],
    ...patch,
  };
}

// --- which observations count as a shelf price -----------------------------

test("isUsableObservation: a plain per-unit rupee price is usable", () => {
  assert.equal(isUsableObservation(obs()), true);
  assert.equal(isUsableObservation(obs({ price_per: "UNIT" })), true);
  assert.equal(isUsableObservation(obs({ price_is_discounted: true, discount_type: "SALE" })), true);
});

test("isUsableObservation: a per-kilogram price is not a per-item price", () => {
  assert.equal(isUsableObservation(obs({ price_per: "KILOGRAM" })), false);
});

test("isUsableObservation: clearance, second-hand and multi-buy prices are not shelf prices", () => {
  for (const discount_type of ["EXPIRES_SOON", "SECOND_HAND", "QUANTITY"]) {
    assert.equal(isUsableObservation(obs({ price_is_discounted: true, discount_type })), false, discount_type);
  }
});

test("isUsableObservation: rejects other currencies, category prices, duplicates and junk", () => {
  assert.equal(isUsableObservation(obs({ currency: "EUR" })), false);
  assert.equal(isUsableObservation(obs({ type: "CATEGORY" })), false);
  assert.equal(isUsableObservation(obs({ duplicate_of: 42 })), false);
  assert.equal(isUsableObservation(obs({ product_code: null })), false);
  assert.equal(isUsableObservation(obs({ price: 0 })), false);
  assert.equal(isUsableObservation(obs({ price: -5 })), false);
  assert.equal(isUsableObservation(obs({ price: Number.NaN })), false);
});

test("isUsableObservation: a pre-discount price over 10× the price is a placeholder", () => {
  // The real record: a price tag with 9,999,999 typed as its pre-discount price.
  const placeholder = obs({ price: 3766.68, price_is_discounted: true, price_without_discount: 9999999 });
  assert.equal(isUsableObservation(placeholder), false);
  assert.equal(isUsableObservation(obs({ price: 100, price_is_discounted: true, price_without_discount: 1001 })), false);
  // Rejected whether or not the record is flagged as discounted.
  assert.equal(isUsableObservation(obs({ price: 100, price_without_discount: 5000 })), false);
});

test("isUsableObservation: real markdowns up to 10× are kept", () => {
  // The largest real markdown in the data: ₹49 against ₹250.
  assert.equal(isUsableObservation(obs({ price: 49, price_is_discounted: true, price_without_discount: 250 })), true);
  assert.equal(isUsableObservation(obs({ price: 100, price_is_discounted: true, price_without_discount: 1000 })), true);
});

test("latestShelfPrice: takes the most recent usable observation, in paise", () => {
  const price = latestShelfPrice([
    obs({ id: 1, date: "2024-01-01", price: 100 }),
    obs({ id: 2, date: "2025-06-30", price: 117.5 }),
    obs({ id: 3, date: "2025-03-01", price: 110 }),
  ]);
  assert.deepEqual(price, { pricePaise: 11750, mrpPaise: 11750, observedOn: "2025-06-30" });
});

test("latestShelfPrice: a newer but unusable observation does not win", () => {
  const price = latestShelfPrice([
    obs({ id: 1, date: "2025-01-01", price: 100 }),
    obs({ id: 2, date: "2025-09-01", price: 40, discount_type: "EXPIRES_SOON", price_is_discounted: true }),
  ]);
  assert.equal(price?.pricePaise, 10000);
});

test("latestShelfPrice: same-day observations break ties on the newest id", () => {
  const price = latestShelfPrice([obs({ id: 7, price: 50 }), obs({ id: 9, price: 55 })]);
  assert.equal(price?.pricePaise, 5500);
});

test("latestShelfPrice: the MRP is the recorded pre-discount price", () => {
  const price = latestShelfPrice([
    obs({ price: 90, price_is_discounted: true, price_without_discount: 120 }),
  ]);
  assert.deepEqual(price, { pricePaise: 9000, mrpPaise: 12000, observedOn: "2025-09-13" });
});

test("latestShelfPrice: with no recorded MRP there is no discount", () => {
  assert.equal(latestShelfPrice([obs({ price: 90 })])?.mrpPaise, 9000);
  // Flagged as discounted, but no higher price recorded: nothing to show.
  const noHigher = latestShelfPrice([obs({ price: 90, price_is_discounted: true, price_without_discount: 90 })]);
  assert.equal(noHigher?.mrpPaise, 9000);
});

test("latestShelfPrice: a newer record with a placeholder MRP gives way to an older valid one", () => {
  const price = latestShelfPrice([
    obs({ id: 1, date: "2025-01-01", price: 40, price_is_discounted: true, price_without_discount: 45 }),
    obs({ id: 2, date: "2025-11-15", price: 3766.68, price_is_discounted: true, price_without_discount: 9999999 }),
  ]);
  assert.deepEqual(price, { pricePaise: 4000, mrpPaise: 4500, observedOn: "2025-01-01" });
});

test("latestShelfPrice: nothing usable means no price at all, not a guess", () => {
  assert.equal(latestShelfPrice([]), null);
  assert.equal(latestShelfPrice([obs({ price_per: "KILOGRAM" })]), null);
  // A product whose only record is corrupt is left out, not priced from it.
  assert.equal(latestShelfPrice([obs({ price: 3766.68, price_is_discounted: true, price_without_discount: 9999999 })]), null);
});

// --- departments ------------------------------------------------------------

test("departmentFor: the most specific department in priority order wins", () => {
  // A dairy drink is filed under Dairies, not Beverages.
  assert.equal(departmentFor(["en:beverages-and-beverages-preparations", "en:dairies"]), "en:dairies");
  assert.equal(departmentFor(["en:plant-based-foods-and-beverages", "en:snacks", "en:salty-snacks"]), "en:salty-snacks");
});

test("departmentFor: free-text or missing tags get no department", () => {
  assert.equal(departmentFor(["en:lime-pickle"]), null);
  assert.equal(departmentFor([]), null);
  assert.equal(departmentFor(undefined), null);
});

test("departmentSlug: drops the language prefix", () => {
  assert.equal(departmentSlug("en:dairies"), "dairies");
});

// --- product fields ---------------------------------------------------------

test("slugify: readable, accent-free, and unique by barcode", () => {
  assert.equal(slugify("Crème Brûlée Mix!", "123"), "creme-brulee-mix-123");
  assert.equal(slugify("   ", "123"), "123");
  assert.equal(slugify("A".repeat(200), "9").length <= 82, true);
});

test("packSize: prefers the structured quantity, falls back to the label text", () => {
  assert.equal(packSize({ code: "1", product_quantity: 180, product_quantity_unit: "ml" }), "180 ml");
  assert.equal(packSize({ code: "1", product_quantity: "400", product_quantity_unit: "g" }), "400 g");
  assert.equal(packSize({ code: "1", quantity: " 2 x 100 g " }), "2 x 100 g");
  assert.equal(packSize({ code: "1" }), null);
});

test("nutrition: keeps only reported numbers, and knows ml from g", () => {
  const n = nutrition({
    code: "1",
    nutriments: { "energy-kcal_100g": 80, "sugars_100g": 9.5, "fat_100g": "unknown", "salt_100g": -1 },
    nutrition_data_per: "100ml",
  });
  assert.deepEqual(n, { nutriments: { energyKcal: 80, sugars: 9.5 }, per: "100ml" });
  assert.equal(nutrition({ code: "1", nutriments: {} }), null);
  assert.equal(nutrition({ code: "1" }), null);
});

test("imageUrl: only Open Food Facts' own https image host is accepted", () => {
  assert.equal(
    imageUrl("https://images.openfoodfacts.org/images/products/1/front_en.400.jpg"),
    "https://images.openfoodfacts.org/images/products/1/front_en.400.jpg",
  );
  // Any other host would make next/image throw at render.
  assert.equal(imageUrl("https://static.example.com/front.jpg"), null);
  assert.equal(imageUrl("http://images.openfoodfacts.org/front.jpg"), null, "https only");
  assert.equal(imageUrl("not a url"), null);
  assert.equal(imageUrl(undefined), null);
});

test("toCatalogProduct: an off-host front image counts as no image", () => {
  assert.equal(
    toCatalogProduct(off({ image_front_url: "https://elsewhere.test/a.jpg", image_url: undefined }), PRICE),
    "no-image",
  );
});

test("toCatalogProduct: a product without a name, image or department is left out", () => {
  assert.equal(toCatalogProduct(off({ product_name: "  ", product_name_en: undefined }), PRICE), "no-name");
  assert.equal(toCatalogProduct(off({ image_front_url: undefined, image_url: undefined }), PRICE), "no-image");
  assert.equal(toCatalogProduct(off({ categories_tags: ["en:lime-pickle"] }), PRICE), "no-department");
});

test("toCatalogProduct: maps a full product faithfully", () => {
  const row = toCatalogProduct(
    off({
      product_name_en: "Chocolate Milk Shake",
      generic_name_en: "Flavoured milk drink",
      brands: "Epigamia, Drums Food",
      product_quantity: 180,
      product_quantity_unit: "ml",
      image_ingredients_url: "https://images.openfoodfacts.org/ingredients.jpg",
      image_nutrition_url: "https://images.openfoodfacts.org/front.jpg", // duplicate of the front
      nutriscore_grade: "E",
      nova_group: 4,
      labels_tags: ["en:vegetarian", "fr:triman"],
      allergens_tags: ["en:milk"],
      ingredients_text_en: "Skimmed milk (80%), sugar",
      unique_scans_n: 3,
      created_t: 1683727528,
    }),
    { pricePaise: 4000, mrpPaise: 4500, observedOn: "2024-08-12" },
  );
  assert.ok(typeof row === "object");
  assert.equal(row.title, "Chocolate Milk Shake");
  assert.equal(row.slug, "chocolate-milk-shake-8901234567890");
  assert.equal(row.description, "Flavoured milk drink");
  assert.equal(row.brand, "Epigamia", "the first listed brand");
  assert.equal(row.categorySlug, "dairies");
  assert.equal(row.quantity, "180 ml");
  assert.equal(row.pricePaise, 4000);
  assert.equal(row.mrpPaise, 4500);
  assert.equal(row.priceObservedOn, "2024-08-12");
  assert.deepEqual(row.images, [
    "https://images.openfoodfacts.org/front.jpg",
    "https://images.openfoodfacts.org/ingredients.jpg",
  ]);
  assert.equal(row.nutriscoreGrade, "e", "normalised to lower case");
  assert.equal(row.novaGroup, 4);
  assert.deepEqual(row.labels, ["en:vegetarian"], "English tags only");
  assert.deepEqual(row.allergens, ["en:milk"]);
  assert.equal(row.ingredientsText, "Skimmed milk (80%), sugar");
  assert.equal(row.scanCount, 3);
  assert.equal(row.createdAt?.toISOString(), "2023-05-10T14:05:28.000Z");
});

test("toCatalogProduct: absent or out-of-range grades are null, never defaulted", () => {
  const row = toCatalogProduct(off({ nutriscore_grade: "unknown", nova_group: 7 }), PRICE);
  assert.ok(typeof row === "object");
  assert.equal(row.nutriscoreGrade, null);
  assert.equal(row.novaGroup, null);
  assert.equal(row.brand, null);
  assert.equal(row.description, null);
  assert.equal(row.nutriments, null);
  assert.equal(row.nutritionPer, null);
  assert.equal(row.scanCount, 0);
  assert.deepEqual(row.labels, []);
  assert.deepEqual(row.allergens, []);
});
