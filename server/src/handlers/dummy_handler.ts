
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput, type Product } from '../schema';
import { eq } from 'drizzle-orm';

/**
 * Updates an existing product in the database.
 * @param input The update product input containing the product ID and optional fields to update.
 * @returns The updated product record.
 * @throws Error if the product with the given ID is not found.
 */
export const updateProduct = async (input: UpdateProductInput): Promise<Product> => {
  try {
    const { id, ...updateFields } = input;
    const toUpdate: Record<string, any> = {};

    // Conditionally add fields to the update object only if they are defined in the input.
    // This ensures that optional fields not provided in the input remain unchanged.
    // Using bracket notation for properties of Record<string, any> to resolve TS4111.
    if (updateFields.name !== undefined) {
      toUpdate['name'] = updateFields.name;
    }
    if (updateFields.description !== undefined) { // Handles both string values and explicit `null`
      toUpdate['description'] = updateFields.description;
    }
    if (updateFields.price !== undefined) {
      toUpdate['price'] = updateFields.price.toString(); // Convert number to string for numeric column
    }
    if (updateFields.stock_quantity !== undefined) {
      toUpdate['stock_quantity'] = updateFields.stock_quantity;
    }

    // If no update fields are provided (only 'id' in the input),
    // fetch the existing product and return it if found.
    // This handles cases where a client might send an update request with no actual changes.
    if (Object.keys(toUpdate).length === 0) {
      const existingProduct = await db.select()
        .from(productsTable)
        .where(eq(productsTable.id, id))
        .execute();

      if (existingProduct.length === 0) {
        throw new Error(`Product with ID ${id} not found.`);
      }
      // Convert numeric fields back to numbers before returning
      return {
        ...existingProduct[0],
        price: parseFloat(existingProduct[0].price),
      };
    }

    // Perform the update operation
    const result = await db.update(productsTable)
      .set(toUpdate)
      .where(eq(productsTable.id, id))
      .returning() // Return the updated record
      .execute();

    if (result.length === 0) {
      // If no record was updated (result array is empty), it means the ID was not found.
      throw new Error(`Product with ID ${id} not found.`);
    }

    // Convert numeric fields back to numbers before returning
    const updatedProduct = result[0];
    return {
      ...updatedProduct,
      price: parseFloat(updatedProduct.price)
    };
  } catch (error) {
    console.error(`Error updating product with ID ${input.id}:`, error);
    throw error;
  }
};
