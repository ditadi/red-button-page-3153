
import { serial, text, pgTable, timestamp, numeric, integer } from 'drizzle-orm/pg-core';

export const productsTable = pgTable('products', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'), // Nullable by default, matches Zod schema
  price: numeric('price', { precision: 10, scale: 2 }).notNull(), // Use numeric for monetary values with precision
  stock_quantity: integer('stock_quantity').notNull(), // Use integer for whole numbers
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// TypeScript type for the table schema
export type Product = typeof productsTable.$inferSelect; // For SELECT operations
export type NewProduct = typeof productsTable.$inferInsert; // For INSERT operations

// Important: Export all tables and relations for proper query building
export const tables = { products: productsTable };
