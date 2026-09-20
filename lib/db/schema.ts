import {
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  real,
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
