import {
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  heroImage: text("hero_image"),
});

/**
 * Per-100 g (or per-100 ml) nutrition, exactly as Open Food Facts reports it.
 * A key is present only when the source has a number for it.
 */
export type Nutriments = Partial<
  Record<"energyKcal" | "fat" | "saturatedFat" | "carbohydrates" | "sugars" | "fiber" | "proteins" | "salt", number>
>;

/**
 * The catalog. Every product is a real Open Food Facts product priced from a
 * real Open Prices observation in rupees — see scripts/seed.ts and
 * DECISIONS.md. Nothing here is invented: a column the sources do not provide
 * for a given product is null rather than guessed.
 */
export const products = pgTable(
  "products",
  {
    // Surrogate key, starting above the old DummyJSON range (1–194) so a guest
    // cart cookie from before the migration can never point at a different
    // product. The import upserts on `barcode`, so ids are stable across syncs.
    id: integer("id").primaryKey().generatedByDefaultAsIdentity({ startWith: 1000 }),
    // The Open Food Facts code. Text, because EAN/UPC codes can start with 0.
    barcode: text("barcode").notNull().unique(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    // Open Food Facts' generic name. Most products do not have one.
    description: text("description"),
    categorySlug: text("category_slug")
      .notNull()
      .references(() => categories.slug),
    brand: text("brand"),
    // Pack size as labelled, e.g. "180 ml".
    quantity: text("quantity"),
    // All money is integer paise. See DECISIONS.md.
    pricePaise: integer("price_paise").notNull(),
    // The printed MRP when the observation recorded one, otherwise the price.
    mrpPaise: integer("mrp_paise").notNull(),
    // When the price was seen in a shop, per Open Prices.
    priceObservedOn: date("price_observed_on", { mode: "string" }).notNull(),
    thumbnail: text("thumbnail").notNull(),
    images: jsonb("images").$type<string[]>().notNull(),
    // a–e, or null when Open Food Facts has not computed one.
    nutriscoreGrade: text("nutriscore_grade"),
    // 1–4, or null.
    novaGroup: integer("nova_group"),
    labels: jsonb("labels").$type<string[]>().notNull(),
    allergens: jsonb("allergens").$type<string[]>().notNull(),
    ingredientsText: text("ingredients_text"),
    nutriments: jsonb("nutriments").$type<Nutriments>(),
    // "100g" or "100ml" — what the nutriments are per. Null with no nutriments.
    nutritionPer: text("nutrition_per"),
    // Open Food Facts' unique scan count — backs "Most scanned".
    scanCount: integer("scan_count").notNull().default(0),
    // When the product entered Open Food Facts — backs New Arrivals.
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("products_category_idx").on(t.categorySlug),
    index("products_created_at_idx").on(t.createdAt),
  ],
);

/**
 * The authenticated cart. One row per product per user, so the composite
 * primary key enforces at the database what the cookie enforces in code.
 *
 * `userId` is a Supabase Auth user id. There is no foreign key to
 * `auth.users`: Drizzle does not manage Supabase's `auth` schema, and account
 * deletion is out of scope. See DECISIONS.md.
 */
export const cartItems = pgTable(
  "cart_items",
  {
    userId: uuid("user_id").notNull(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    quantity: integer("quantity").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.productId] }), index("cart_items_user_idx").on(t.userId)],
);

export type CartItemRow = typeof cartItems.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Category = typeof categories.$inferSelect;

/**
 * A placed order. The shipping address is snapshotted into these columns
 * rather than referenced: there is no address book, and an order must keep
 * saying where it was actually sent even if a future profile edits it.
 *
 * Money is integer paise, computed server-side from the catalog at the moment
 * the order was placed. Nothing here comes from the browser except the
 * address fields and which demo payment method was chosen.
 *
 * `userId` is a Supabase Auth user id, with no foreign key, for the same
 * reason as `cartItems`. See DECISIONS.md.
 */
export const orders = pgTable(
  "orders",
  {
    id: serial("id").primaryKey(),
    // Human-readable and unique — the number we show the shopper.
    orderNumber: text("order_number").notNull().unique(),
    userId: uuid("user_id").notNull(),
    email: text("email").notNull(),

    fullName: text("full_name").notNull(),
    phone: text("phone").notNull(),
    addressLine1: text("address_line1").notNull(),
    addressLine2: text("address_line2"),
    city: text("city").notNull(),
    state: text("state").notNull(),
    postalCode: text("postal_code").notNull(),

    paymentMethod: text("payment_method").notNull(),
    status: text("status").notNull().default("placed"),

    subtotalPaise: integer("subtotal_paise").notNull(),
    deliveryPaise: integer("delivery_paise").notNull(),
    totalPaise: integer("total_paise").notNull(),
    // The delivery date we promised, already formatted. Kept because it is
    // what the shopper was told, not something to recompute later.
    arrivesBy: text("arrives_by"),

    placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("orders_user_idx").on(t.userId), index("orders_placed_at_idx").on(t.placedAt)],
);

/**
 * One line per product, snapshotting what was bought at what was paid.
 * `productId` is nullable and clears if the product leaves the catalog: the
 * link to a live product page is a convenience, the snapshot is the record.
 */
export const orderItems = pgTable(
  "order_items",
  {
    id: serial("id").primaryKey(),
    orderId: integer("order_id")
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: integer("product_id").references(() => products.id, { onDelete: "set null" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    brand: text("brand"),
    thumbnail: text("thumbnail").notNull(),
    unitPricePaise: integer("unit_price_paise").notNull(),
    quantity: integer("quantity").notNull(),
    linePaise: integer("line_paise").notNull(),
  },
  (t) => [index("order_items_order_idx").on(t.orderId)],
);

export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
