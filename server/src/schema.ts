
import { z } from 'zod';

// Product schema with proper numeric handling
export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(), // Nullable field, not optional (can be explicitly null)
  price: z.number(), // Stored as numeric in DB, but we use number in TS
  stock_quantity: z.number().int(), // Ensures integer values only
  created_at: z.coerce.date() // Automatically converts string timestamps to Date objects
});

export type Product = z.infer<typeof productSchema>;

// Input schema for creating products
export const createProductInputSchema = z.object({
  name: z.string(),
  description: z.string().nullable(), // Explicit null allowed, undefined not allowed
  price: z.number().positive(), // Validate that price is positive
  stock_quantity: z.number().int().nonnegative() // Validate that stock is non-negative integer
});

export type CreateProductInput = z.infer<typeof createProductInputSchema>;

// Input schema for updating products
export const updateProductInputSchema = z.object({
  id: z.number(),
  name: z.string().optional(), // Optional = field can be undefined (omitted)
  description: z.string().nullable().optional(), // Can be null or undefined
  price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional()
});

export type UpdateProductInput = z.infer<typeof updateProductInputSchema>;
