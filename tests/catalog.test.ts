/**
 * Unit tests for how catalog data is displayed and filtered: prices with
 * paise, real discounts, Nutri-Score and the search parameter that replaced
 * the rating filter. Run with `npm test`.
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { discountLabel, discountPercent, formatCalendarDate, formatPrice } from "../lib/format";
import { humaniseTag, novaMeaning, nutriscoreMeaning, nutritionRows } from "../lib/product";
import { gradesUpTo, hasActiveFilters, parseSearchQuery, searchHref } from "../lib/search-params";

test("formatPrice: whole rupees stay whole", () => {
  assert.equal(formatPrice(12000), "₹120");
  assert.equal(formatPrice(150000), "₹1,500");
});

test("formatPrice: paise are shown, never rounded away", () => {
  // A real receipt price. Rounding it to ₹3,767 would misstate it.
  assert.equal(formatPrice(376668), "₹3,766.68");
  assert.equal(formatPrice(1250), "₹12.50");
});

test("formatPrice: lines and totals agree to the paisa", () => {
  // 3 × ₹12.50: rounding each line to whole rupees would show ₹13 × 3 ≠ total.
  assert.equal(formatPrice(3 * 1250), "₹37.50");
});

test("discountPercent: only a price below the MRP is a discount", () => {
  assert.equal(discountPercent(9000, 12000), 25);
  assert.equal(discountPercent(12000, 12000), 0);
  assert.equal(discountPercent(13000, 12000), 0, "a price above MRP is not a negative discount");
  assert.equal(discountPercent(100, 0), 0);
  assert.equal(discountLabel(9000, 12000), "25% off");
});

test("formatCalendarDate: a date-only value never shifts a day", () => {
  // en-IN abbreviates September as "Sep" or "Sept" depending on the ICU build.
  assert.match(formatCalendarDate("2025-09-13"), /^13 Sept? 2025$/);
  assert.match(formatCalendarDate("2024-01-01"), /^1 Jan 2024$/);
});

test("nutriscoreMeaning / novaMeaning: the schemes' own wording, or nothing", () => {
  assert.equal(nutriscoreMeaning("a"), "Very good nutritional quality");
  assert.equal(nutriscoreMeaning("e"), "Bad nutritional quality");
  assert.equal(nutriscoreMeaning("unknown"), null);
  assert.equal(nutriscoreMeaning(null), null);
  assert.equal(novaMeaning(4), "Ultra-processed food");
  assert.equal(novaMeaning(9), null);
  assert.equal(novaMeaning(null), null);
});

test("humaniseTag: drops the language prefix and hyphens", () => {
  assert.equal(humaniseTag("en:no-gluten"), "No gluten");
  assert.equal(humaniseTag("en:milk"), "Milk");
});

test("nutritionRows: only present nutrients, in label order, sensibly rounded", () => {
  const rows = nutritionRows({ sugars: 9.4999, energyKcal: 80, proteins: 3 });
  assert.deepEqual(
    rows.map((r) => [r.label, r.value, r.indent]),
    [
      ["Energy", "80 kcal", false],
      ["of which sugars", "9.5 g", true],
      ["Protein", "3 g", false],
    ],
  );
});

test("gradesUpTo: a grade means that grade or better", () => {
  assert.deepEqual(gradesUpTo("a"), ["a"]);
  assert.deepEqual(gradesUpTo("c"), ["a", "b", "c"]);
});

test("parseSearchQuery: accepts a Nutri-Score grade, rejects anything else", () => {
  assert.equal(parseSearchQuery({ nutriscore: "b" }).nutriscore, "b");
  assert.equal(parseSearchQuery({ nutriscore: "B" }).nutriscore, "b", "case-insensitive");
  assert.equal(parseSearchQuery({ nutriscore: "f" }).nutriscore, null);
  assert.equal(parseSearchQuery({ nutriscore: "1" }).nutriscore, null);
  assert.equal(parseSearchQuery({}).nutriscore, null);
});

test("parseSearchQuery: the retired rating sort falls back to relevance", () => {
  assert.equal(parseSearchQuery({ sort: "rating" }).sort, "relevance");
  assert.equal(parseSearchQuery({ sort: "popular" }).sort, "popular");
  assert.equal(parseSearchQuery({ sort: "nutriscore" }).sort, "nutriscore");
});

test("searchHref: the Nutri-Score filter round-trips through the URL", () => {
  const q = parseSearchQuery({ q: "biscuit", nutriscore: "c" });
  assert.equal(searchHref(q, {}), "/search?q=biscuit&nutriscore=c");
  assert.equal(searchHref(q, { nutriscore: null }), "/search?q=biscuit");
  assert.equal(hasActiveFilters(q), true);
  assert.equal(hasActiveFilters(parseSearchQuery({ q: "biscuit" })), false);
});
