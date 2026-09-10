// 벤더 유통사 폐쇄몰 데이터 모델 (Drizzle ORM / PostgreSQL)
// - 회원가입 승인제 로그인 (users.status)
// - 거래처별 차등 단가 (priceTiers, productTierPrices)
// - 재고/상품 관리 (products)
// - 견적서/발주 관리 (orders, orderItems)

import {
  pgTable,
  text,
  timestamp,
  numeric,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["ADMIN", "VENDOR"]);
export const userStatusEnum = pgEnum("user_status", [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
]);
export const orderTypeEnum = pgEnum("order_type", ["QUOTE", "ORDER"]);
export const orderStatusEnum = pgEnum("order_status", [
  "REQUESTED",
  "CONFIRMED",
  "REJECTED",
  "COMPLETED",
  "CANCELLED",
]);

export const priceTiers = pgTable("price_tiers", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  discountPercent: numeric("discount_percent", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("VENDOR"),
  status: userStatusEnum("status").notNull().default("PENDING"),

  companyName: text("company_name").notNull(),
  businessRegNo: text("business_reg_no"),
  contactName: text("contact_name").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  memo: text("memo"),

  tierId: text("tier_id").references(() => priceTiers.id),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
});

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(),
  category: text("category"),
  unit: text("unit").notNull().default("EA"),
  basePrice: numeric("base_price", { precision: 12, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  safetyStock: integer("safety_stock").notNull().default(0),
  description: text("description"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const productTierPrices = pgTable(
  "product_tier_prices",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    tierId: text("tier_id")
      .notNull()
      .references(() => priceTiers.id, { onDelete: "cascade" }),
    price: numeric("price", { precision: 12, scale: 2 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("product_tier_unique").on(t.productId, t.tierId)]
);

export const orders = pgTable("orders", {
  id: text("id").primaryKey(),
  orderNo: text("order_no").notNull().unique(),
  type: orderTypeEnum("type").notNull(),
  status: orderStatusEnum("status").notNull().default("REQUESTED"),

  userId: text("user_id")
    .notNull()
    .references(() => users.id),

  totalAmount: numeric("total_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  note: text("note"),
  adminNote: text("admin_note"),
  taxInvoiceRequested: boolean("tax_invoice_requested").notNull().default(false),
  bankTransferInfo: text("bank_transfer_info"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  confirmedAt: timestamp("confirmed_at"),
});

export const orderItems = pgTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),

  productName: text("product_name").notNull(),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }).notNull(),
  quantity: integer("quantity").notNull(),
  lineTotal: numeric("line_total", { precision: 14, scale: 2 }).notNull(),
});

// ---- Relations ----

export const usersRelations = relations(users, ({ one, many }) => ({
  tier: one(priceTiers, {
    fields: [users.tierId],
    references: [priceTiers.id],
  }),
  orders: many(orders),
}));

export const priceTiersRelations = relations(priceTiers, ({ many }) => ({
  users: many(users),
  tierPrices: many(productTierPrices),
}));

export const productsRelations = relations(products, ({ many }) => ({
  tierPrices: many(productTierPrices),
  orderItems: many(orderItems),
}));

export const productTierPricesRelations = relations(
  productTierPrices,
  ({ one }) => ({
    product: one(products, {
      fields: [productTierPrices.productId],
      references: [products.id],
    }),
    tier: one(priceTiers, {
      fields: [productTierPrices.tierId],
      references: [priceTiers.id],
    }),
  })
);

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, { fields: [orders.userId], references: [users.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
