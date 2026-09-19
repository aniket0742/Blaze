CREATE TABLE "categories" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hero_image" text
);
--> statement-breakpoint
CREATE TABLE "product_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text NOT NULL,
	"reviewer_name" text NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" integer PRIMARY KEY NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"category_slug" text NOT NULL,
	"brand" text,
	"price_paise" integer NOT NULL,
	"mrp_paise" integer NOT NULL,
	"discount_percentage" real NOT NULL,
	"rating" real NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"stock" integer NOT NULL,
	"availability_status" text NOT NULL,
	"sku" text NOT NULL,
	"thumbnail" text NOT NULL,
	"images" jsonb NOT NULL,
	"tags" jsonb NOT NULL,
	"weight_grams" real,
	"dimensions" jsonb,
	"warranty_information" text,
	"shipping_information" text NOT NULL,
	"return_policy" text,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "product_reviews" ADD CONSTRAINT "product_reviews_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_slug_categories_slug_fk" FOREIGN KEY ("category_slug") REFERENCES "public"."categories"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "product_reviews_product_idx" ON "product_reviews" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "products_category_idx" ON "products" USING btree ("category_slug");--> statement-breakpoint
CREATE INDEX "products_rating_idx" ON "products" USING btree ("rating");