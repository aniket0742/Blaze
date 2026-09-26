/**
 * Display vocabulary for Open Food Facts data. Pure and client-safe, like
 * lib/format.ts. These label what the source says; they never add to it.
 */
import type { Nutriments } from "./db/schema";

export const NUTRISCORE_GRADES = ["a", "b", "c", "d", "e"] as const;
export type NutriscoreGrade = (typeof NUTRISCORE_GRADES)[number];

/** The Nutri-Score scheme's own wording for each grade. */
const NUTRISCORE_MEANING: Record<NutriscoreGrade, string> = {
  a: "Very good nutritional quality",
  b: "Good nutritional quality",
  c: "Average nutritional quality",
  d: "Poor nutritional quality",
  e: "Bad nutritional quality",
};

export function isNutriscoreGrade(value: unknown): value is NutriscoreGrade {
  return typeof value === "string" && (NUTRISCORE_GRADES as readonly string[]).includes(value);
}

export function nutriscoreMeaning(grade: string | null): string | null {
  return isNutriscoreGrade(grade) ? NUTRISCORE_MEANING[grade] : null;
}

/** The NOVA classification's own names for its four groups. */
const NOVA_MEANING: Record<number, string> = {
  1: "Unprocessed or minimally processed",
  2: "Processed culinary ingredient",
  3: "Processed food",
  4: "Ultra-processed food",
};

export function novaMeaning(group: number | null): string | null {
  return group !== null ? (NOVA_MEANING[group] ?? null) : null;
}

/** `en:no-gluten` → `No gluten`. */
export function humaniseTag(tag: string): string {
  const words = tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ").trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

/** Rows for a nutrition table, in label order, for the nutrients present. */
export function nutritionRows(n: Nutriments): { label: string; value: string; indent: boolean }[] {
  const rows: [keyof Nutriments, string, string, boolean][] = [
    ["energyKcal", "Energy", "kcal", false],
    ["fat", "Fat", "g", false],
    ["saturatedFat", "of which saturates", "g", true],
    ["carbohydrates", "Carbohydrate", "g", false],
    ["sugars", "of which sugars", "g", true],
    ["fiber", "Fibre", "g", false],
    ["proteins", "Protein", "g", false],
    ["salt", "Salt", "g", false],
  ];
  return rows
    .filter(([key]) => typeof n[key] === "number")
    .map(([key, label, unit, indent]) => ({
      label,
      value: `${Number(n[key]!.toFixed(1))} ${unit}`,
      indent,
    }));
}
