/*
 * Milestone 9A — the DummyJSON catalog is replaced by Open Food Facts.
 *
 * Data transition, deliberately inside the migration: the Open Food Facts
 * columns added in 0004 are NOT NULL, so the old catalog rows have to go
 * first, and drizzle applies every pending migration in one transaction —
 * a failure anywhere leaves the old catalog untouched.
 *
 * Deleting products:
 *   - cascades to cart_items (those lines point at products that no longer
 *     exist, and would be dropped as stale by the cart anyway)
 *   - sets order_items.product_id to NULL. Placed orders keep rendering from
 *     their own snapshot of title, price and image — see DECISIONS.md.
 *
 * On a fresh database both deletes are no-ops.
 */
DELETE FROM "products";--> statement-breakpoint
DELETE FROM "categories";--> statement-breakpoint
ALTER TABLE "product_reviews" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "product_reviews" CASCADE;--> statement-breakpoint
DROP INDEX "products_rating_idx";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "discount_percentage";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "rating";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "review_count";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "stock";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "availability_status";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "sku";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "tags";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "weight_grams";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "dimensions";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "warranty_information";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "shipping_information";--> statement-breakpoint
ALTER TABLE "products" DROP COLUMN "return_policy";