CREATE TYPE "public"."order_status" AS ENUM('REQUESTED', 'CONFIRMED', 'REJECTED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."order_type" AS ENUM('QUOTE', 'ORDER');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('ADMIN', 'VENDOR');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text NOT NULL,
	"product_id" text NOT NULL,
	"product_name" text NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"quantity" integer NOT NULL,
	"line_total" numeric(14, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"order_no" text NOT NULL,
	"type" "order_type" NOT NULL,
	"status" "order_status" DEFAULT 'REQUESTED' NOT NULL,
	"user_id" text NOT NULL,
	"total_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"note" text,
	"admin_note" text,
	"tax_invoice_requested" boolean DEFAULT false NOT NULL,
	"bank_transfer_info" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"confirmed_at" timestamp,
	CONSTRAINT "orders_order_no_unique" UNIQUE("order_no")
);
--> statement-breakpoint
CREATE TABLE "price_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "price_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_tier_prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"unit" text DEFAULT 'EA' NOT NULL,
	"base_price" numeric(12, 2) NOT NULL,
	"stock" integer DEFAULT 0 NOT NULL,
	"safety_stock" integer DEFAULT 0 NOT NULL,
	"description" text,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'VENDOR' NOT NULL,
	"status" "user_status" DEFAULT 'PENDING' NOT NULL,
	"company_name" text NOT NULL,
	"business_reg_no" text,
	"contact_name" text NOT NULL,
	"phone" text NOT NULL,
	"address" text,
	"memo" text,
	"tier_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tier_prices" ADD CONSTRAINT "product_tier_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_tier_prices" ADD CONSTRAINT "product_tier_prices_tier_id_price_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."price_tiers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_tier_id_price_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."price_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "product_tier_unique" ON "product_tier_prices" USING btree ("product_id","tier_id");