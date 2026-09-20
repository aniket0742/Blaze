CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"product_id" integer,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"brand" text,
	"thumbnail" text NOT NULL,
	"unit_price_paise" integer NOT NULL,
	"quantity" integer NOT NULL,
	"line_paise" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_number" text NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"phone" text NOT NULL,
	"address_line1" text NOT NULL,
	"address_line2" text,
	"city" text NOT NULL,
	"state" text NOT NULL,
	"postal_code" text NOT NULL,
	"payment_method" text NOT NULL,
	"status" text DEFAULT 'placed' NOT NULL,
	"subtotal_paise" integer NOT NULL,
	"delivery_paise" integer NOT NULL,
	"total_paise" integer NOT NULL,
	"arrives_by" text,
	"placed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "order_items_order_idx" ON "order_items" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "orders_user_idx" ON "orders" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "orders_placed_at_idx" ON "orders" USING btree ("placed_at");--> statement-breakpoint
/*
 * Repair, not part of this milestone's schema change.
 *
 * `products.created_at` was applied in Milestone 1 with `db:push`, which does
 * not write a migration. The 0000 SQL therefore never creates it, even though
 * every snapshot from 0001 on claims it exists — so replaying this chain into
 * a fresh database produced a `products` table without it, and the New
 * Arrivals rail and "newest" sort would fail there.
 *
 * Both statements are `IF NOT EXISTS`: a no-op against the live database,
 * where the column and index already exist. See DECISIONS.md.
 */
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "created_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "products_created_at_idx" ON "products" USING btree ("created_at");
