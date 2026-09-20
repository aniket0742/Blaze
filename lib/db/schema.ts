import { index, integer, jsonb, pgTable, real, serial, text, timestamp } from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  heroImage: text("hero_image"),
});

export const products = pgTable(
  "products",
  {
    // DummyJSON's own id, kept so reseeding is stable.
    id: integer("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug),
    brand: text("brand"),
    // All money is integer paise. See DECISIONS.md.
    pricePaise: integer("price_paise").notNull(),
    mrpPaise: integer("mrp_paise").notNull(),
    discountPercentage: real("discount_percentage").notNull(),
    rating: real("rating").notNull(),
    reviewCount: integer("review_count").notNull().default(0),
    stock: integer("stock").notNull(),
    availabilityStatus: text("availability_status").notNull(),
    sku: text("sku").notNull(),
    thumbnail: text("thumbnail").notNull(),
    images: jsonb("images").$type<string[]>().notNull(),
    tags: jsonb("tags").$type<string[]>().notNull(),
    weightGrams: real("weight_grams"),
    dimensions: jsonb("dimensions").$type<{ width: number; height: number; depth: number }>(),
    warrantyInformation: text("warranty_information"),
    shippingInformation: text("shipping_information").notNull(),
    returnPolicy: text("return_policy"),
    // DummyJSON's meta.createdAt — backs the New Arrivals rail.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categorySlug),
    index("products_rating_idx").on(t.rating),
    index("products_created_at_idx").on(t.createdAt),
  ],
);

export const productReviews = pgTable(
  "product_reviews",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    comment: text("comment").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
  },
  (t) => [index("product_reviews_product_idx").on(t.productId)],
);

export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;
