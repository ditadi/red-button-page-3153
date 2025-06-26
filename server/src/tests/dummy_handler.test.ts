
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { productsTable } from '../db/schema';
import { type UpdateProductInput } from '../schema';
import { updateProduct } from '../handlers/dummy_handler'; // Import the handler from the specified path
import { eq } from 'drizzle-orm';

// Helper function to insert a product directly into the DB for test setup
// This avoids using other handlers in tests, as per instructions.
const insertTestProduct = async (name: string, description: string | null = null, price: number = 10.00, stock: number = 10) => {
  const result = await db.insert(productsTable)
    .values({
      name,
      description,
      price: price.toString(), // Convert number to string for numeric column
      stock_quantity: stock
    })
    .returning()
    .execute();
  // Return the first inserted product, converting price back to number for consistency
  return {
    ...result[0],
    price: parseFloat(result[0].price),
  };
};

describe('updateProduct', () => {
  beforeEach(createDB); // Setup a clean database for each test
  afterEach(resetDB); // Reset the database after each test

  it('should update all specified fields of an existing product', async () => {
    // Arrange: Create an initial product in the database
    const originalProduct = await insertTestProduct('Old Product Name', 'Old description here', 50.00, 10);

    const updateInput: UpdateProductInput = {
      id: originalProduct.id,
      name: 'New Product Name',
      description: 'An updated description for the product.',
      price: 99.99,
      stock_quantity: 200
    };

    // Act: Call the update handler
    const updatedProduct = await updateProduct(updateInput);

    // Assert: Verify the returned product's fields
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct.id).toEqual(originalProduct.id);
    expect(updatedProduct.name).toEqual('New Product Name');
    expect(updatedProduct.description).toEqual('An updated description for the product.');
    expect(updatedProduct.price).toEqual(99.99); // Verify numeric conversion
    expect(typeof updatedProduct.price).toBe('number');
    expect(updatedProduct.stock_quantity).toEqual(200);
    expect(updatedProduct.created_at.getTime()).toEqual(originalProduct.created_at.getTime()); // created_at should not change

    // Assert: Verify the update persisted in the database
    const productInDb = await db.select().from(productsTable).where(eq(productsTable.id, originalProduct.id)).execute();
    expect(productInDb).toHaveLength(1);
    expect(productInDb[0].name).toEqual('New Product Name');
    expect(productInDb[0].description).toEqual('An updated description for the product.');
    expect(parseFloat(productInDb[0].price)).toEqual(99.99); // Verify DB value numeric conversion
    expect(productInDb[0].stock_quantity).toEqual(200);
  });

  it('should update only specified fields and leave others unchanged', async () => {
    // Arrange: Create a product
    const originalProduct = await insertTestProduct('Original Product', 'Some initial description', 25.50, 50);

    const updateInput: UpdateProductInput = {
      id: originalProduct.id,
      name: 'Updated Name Only',      // Only updating name
      stock_quantity: 60              // and stock quantity
    };

    // Act: Update the product with partial input
    const updatedProduct = await updateProduct(updateInput);

    // Assert: Verify returned product has updated fields and others are unchanged
    expect(updatedProduct.id).toEqual(originalProduct.id);
    expect(updatedProduct.name).toEqual('Updated Name Only');
    expect(updatedProduct.description).toEqual(originalProduct.description); // Should be unchanged
    expect(updatedProduct.price).toEqual(originalProduct.price);             // Should be unchanged
    expect(updatedProduct.stock_quantity).toEqual(60);

    // Assert: Verify DB state reflects partial update
    const productInDb = await db.select().from(productsTable).where(eq(productsTable.id, originalProduct.id)).execute();
    expect(productInDb).toHaveLength(1);
    expect(productInDb[0].name).toEqual('Updated Name Only');
    expect(productInDb[0].description).toEqual('Some initial description'); // Confirmed unchanged
    expect(parseFloat(productInDb[0].price)).toEqual(25.50);             // Confirmed unchanged
    expect(productInDb[0].stock_quantity).toEqual(60);
  });

  it('should set description to null if explicitly provided as null', async () => {
    // Arrange: Create a product with a description
    const originalProduct = await insertTestProduct('Product With Description', 'This is a description that will be nulled.');

    const updateInput: UpdateProductInput = {
      id: originalProduct.id,
      description: null // Explicitly set description to null
    };

    // Act
    const updatedProduct = await updateProduct(updateInput);

    // Assert: Description should be null
    expect(updatedProduct.id).toEqual(originalProduct.id);
    expect(updatedProduct.description).toBeNull();
    expect(updatedProduct.name).toEqual(originalProduct.name); // Other fields unchanged

    // Assert: DB state confirms null description
    const productInDb = await db.select().from(productsTable).where(eq(productsTable.id, originalProduct.id)).execute();
    expect(productInDb).toHaveLength(1);
    expect(productInDb[0].description).toBeNull();
  });

  it('should return the existing product without modification if no fields are provided for update', async () => {
    // Arrange: Create a product
    const originalProduct = await insertTestProduct('No Change Product', 'Initial desc', 100.00, 10);

    const updateInput: UpdateProductInput = {
      id: originalProduct.id
      // No other fields provided, meaning no actual update is requested
    };

    // Act: Call the update handler with only the ID
    const returnedProduct = await updateProduct(updateInput);

    // Assert: The returned product should be identical to the original
    expect(returnedProduct.id).toEqual(originalProduct.id);
    expect(returnedProduct.name).toEqual(originalProduct.name);
    expect(returnedProduct.description).toEqual(originalProduct.description);
    expect(returnedProduct.price).toEqual(originalProduct.price);
    expect(returnedProduct.stock_quantity).toEqual(originalProduct.stock_quantity);
    expect(returnedProduct.created_at.getTime()).toEqual(originalProduct.created_at.getTime()); // Date objects compared by time

    // Assert: Verify DB state remains unchanged (optional, but good for confidence)
    const productInDb = await db.select().from(productsTable).where(eq(productsTable.id, originalProduct.id)).execute();
    expect(productInDb).toHaveLength(1);
    expect(productInDb[0].name).toEqual(originalProduct.name);
    expect(parseFloat(productInDb[0].price)).toEqual(originalProduct.price);
  });

  it('should throw an error if the product ID does not exist', async () => {
    // Arrange: A non-existent ID
    const nonExistentId = 999;
    const updateInput: UpdateProductInput = {
      id: nonExistentId,
      name: 'Attempt to update non-existent product'
    };

    // Act & Assert: Expect the handler to throw an error
    await expect(updateProduct(updateInput)).rejects.toThrow(`Product with ID ${nonExistentId} not found.`);
  });
});
