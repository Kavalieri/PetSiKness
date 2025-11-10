"use server";

/**
 * Server Actions for Foods Management
 * Pet SiKness - CRUD Operations
 */

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";
import { requireHousehold } from "@/lib/auth";
import { FoodFormSchema, FoodUpdateSchema } from "@/lib/schemas/food";
import type { Foods } from "@/types/database.generated";
import type { FoodFormData } from "@/types/foods";

// ============================================
// Get All Foods (List)
// ============================================

/**
 * Get all active foods for the current household
 * @returns List of foods ordered by name
 */
export async function getFoods(): Promise<Result<Foods[]>> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Query foods
    const result = await query(
      `SELECT * FROM foods
       WHERE household_id = $1 AND is_active = TRUE
       ORDER BY name ASC`,
      [householdId]
    );

    return ok(result.rows as Foods[]);
  } catch (error) {
    console.error("[getFoods] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al cargar alimentos"
    );
  }
}

// ============================================
// Get Food by ID
// ============================================

/**
 * Get single food by ID
 * @param id - Food UUID
 * @returns Food data or error
 */
export async function getFoodById(id: string): Promise<Result<Foods>> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Validate UUID format
    if (!id || typeof id !== "string") {
      return fail("ID de alimento inválido");
    }

    // 3. Query food with household check
    const result = await query(
      `SELECT * FROM foods
       WHERE id = $1 AND household_id = $2`,
      [id, householdId]
    );

    // 4. Check if found
    if (result.rows.length === 0) {
      return fail("Alimento no encontrado");
    }

    return ok(result.rows[0] as Foods);
  } catch (error) {
    console.error("[getFoodById] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al cargar alimento"
    );
  }
}

// ============================================
// Create Food
// ============================================

/**
 * Create new food for the household
 * @param data - Food form data
 * @returns Created food or error
 */
export async function createFood(
  data: FoodFormData
): Promise<Result<Foods>> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Validate with Zod
    const parsed = FoodFormSchema.safeParse(data);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return fail(
        firstError || "Datos inválidos",
        errors as Record<string, string[]>
      );
    }

    const validData = parsed.data;

    // 3. Insert food
    const result = await query(
      `INSERT INTO foods (
        household_id,
        name,
        brand,
        food_type,
        calories_per_100g,
        protein_percentage,
        fat_percentage,
        carbs_percentage,
        fiber_percentage,
        moisture_percentage,
        ingredients,
        serving_size_grams,
        package_size_grams,
        price_per_package,
        palatability,
        digestibility,
        suitable_for_species,
        age_range
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18
      )
      RETURNING *`,
      [
        householdId,
        validData.name,
        validData.brand || null,
        validData.food_type,
        validData.calories_per_100g || null,
        validData.protein_percentage || null,
        validData.fat_percentage || null,
        validData.carbs_percentage || null,
        validData.fiber_percentage || null,
        validData.moisture_percentage || null,
        validData.ingredients || null,
        validData.serving_size_grams || null,
        validData.package_size_grams || null,
        validData.price_per_package || null,
        validData.palatability || null,
        validData.digestibility || null,
        validData.suitable_for_species || [],
        validData.age_range || null,
      ]
    );

    // 4. Revalidate routes
    revalidatePath("/foods");

    return ok(result.rows[0] as Foods);
  } catch (error) {
    console.error("[createFood] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al crear alimento"
    );
  }
}

// ============================================
// Update Food
// ============================================

/**
 * Update existing food
 * @param id - Food UUID
 * @param data - Partial food data to update
 * @returns Updated food or error
 */
export async function updateFood(
  id: string,
  data: Partial<FoodFormData>
): Promise<Result<Foods>> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Validate UUID
    if (!id || typeof id !== "string") {
      return fail("ID de alimento inválido");
    }

    // 3. Validate with Zod (partial)
    const parsed = FoodUpdateSchema.safeParse(data);
    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0];
      return fail(
        firstError || "Datos inválidos",
        errors as Record<string, string[]>
      );
    }

    const validData = parsed.data;

    // 4. Build dynamic UPDATE query
    const updates: string[] = [];
    const values: unknown[] = [id, householdId];
    let paramIndex = 3;

    if (validData.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(validData.name);
    }
    if (validData.brand !== undefined) {
      updates.push(`brand = $${paramIndex++}`);
      values.push(validData.brand);
    }
    if (validData.food_type !== undefined) {
      updates.push(`food_type = $${paramIndex++}`);
      values.push(validData.food_type);
    }
    if (validData.calories_per_100g !== undefined) {
      updates.push(`calories_per_100g = $${paramIndex++}`);
      values.push(validData.calories_per_100g);
    }
    if (validData.protein_percentage !== undefined) {
      updates.push(`protein_percentage = $${paramIndex++}`);
      values.push(validData.protein_percentage);
    }
    if (validData.fat_percentage !== undefined) {
      updates.push(`fat_percentage = $${paramIndex++}`);
      values.push(validData.fat_percentage);
    }
    if (validData.carbs_percentage !== undefined) {
      updates.push(`carbs_percentage = $${paramIndex++}`);
      values.push(validData.carbs_percentage);
    }
    if (validData.fiber_percentage !== undefined) {
      updates.push(`fiber_percentage = $${paramIndex++}`);
      values.push(validData.fiber_percentage);
    }
    if (validData.moisture_percentage !== undefined) {
      updates.push(`moisture_percentage = $${paramIndex++}`);
      values.push(validData.moisture_percentage);
    }
    if (validData.ingredients !== undefined) {
      updates.push(`ingredients = $${paramIndex++}`);
      values.push(validData.ingredients);
    }
    if (validData.serving_size_grams !== undefined) {
      updates.push(`serving_size_grams = $${paramIndex++}`);
      values.push(validData.serving_size_grams);
    }
    if (validData.package_size_grams !== undefined) {
      updates.push(`package_size_grams = $${paramIndex++}`);
      values.push(validData.package_size_grams);
    }
    if (validData.price_per_package !== undefined) {
      updates.push(`price_per_package = $${paramIndex++}`);
      values.push(validData.price_per_package);
    }
    if (validData.palatability !== undefined) {
      updates.push(`palatability = $${paramIndex++}`);
      values.push(validData.palatability);
    }
    if (validData.digestibility !== undefined) {
      updates.push(`digestibility = $${paramIndex++}`);
      values.push(validData.digestibility);
    }
    if (validData.suitable_for_species !== undefined) {
      updates.push(`suitable_for_species = $${paramIndex++}`);
      values.push(validData.suitable_for_species);
    }
    if (validData.age_range !== undefined) {
      updates.push(`age_range = $${paramIndex++}`);
      values.push(validData.age_range);
    }

    // 5. Check if any updates
    if (updates.length === 0) {
      return fail("No hay cambios para actualizar");
    }

    // 6. Execute UPDATE
    const result = await query(
      `UPDATE foods
       SET ${updates.join(", ")}
       WHERE id = $1 AND household_id = $2
       RETURNING *`,
      values
    );

    // 7. Check if found
    if (result.rows.length === 0) {
      return fail("Alimento no encontrado");
    }

    // 8. Revalidate routes
    revalidatePath("/foods");
    revalidatePath(`/foods/${id}`);

    return ok(result.rows[0] as Foods);
  } catch (error) {
    console.error("[updateFood] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al actualizar alimento"
    );
  }
}

// ============================================
// Delete Food (Soft Delete)
// ============================================

/**
 * Soft delete food (set is_active = false)
 * @param id - Food UUID
 * @returns Success or error
 */
export async function deleteFood(id: string): Promise<Result> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Validate UUID
    if (!id || typeof id !== "string") {
      return fail("ID de alimento inválido");
    }

    // 3. Soft delete (set is_active = false)
    const result = await query(
      `UPDATE foods
       SET is_active = FALSE
       WHERE id = $1 AND household_id = $2
       RETURNING id`,
      [id, householdId]
    );

    // 4. Check if found
    if (result.rows.length === 0) {
      return fail("Alimento no encontrado");
    }

    // 5. Revalidate routes
    revalidatePath("/foods");
    revalidatePath(`/foods/${id}`);

    return ok();
  } catch (error) {
    console.error("[deleteFood] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al eliminar alimento"
    );
  }
}

// ============================================
// Restore Food (Reactivate)
// ============================================

/**
 * Restore soft-deleted food (set is_active = true)
 * @param id - Food UUID
 * @returns Success or error
 */
export async function restoreFood(id: string): Promise<Result> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Validate UUID
    if (!id || typeof id !== "string") {
      return fail("ID de alimento inválido");
    }

    // 3. Reactivate (set is_active = true)
    const result = await query(
      `UPDATE foods
       SET is_active = TRUE
       WHERE id = $1 AND household_id = $2
       RETURNING id`,
      [id, householdId]
    );

    // 4. Check if found
    if (result.rows.length === 0) {
      return fail("Alimento no encontrado");
    }

    // 5. Revalidate routes
    revalidatePath("/foods");
    revalidatePath(`/foods/${id}`);

    return ok();
  } catch (error) {
    console.error("[restoreFood] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al restaurar alimento"
    );
  }
}

// ============================================
// Search Foods (with filters)
// ============================================

/**
 * Search foods with optional filters
 * @param filters - Search and filter options
 * @returns Filtered foods list
 */
export async function searchFoods(filters?: {
  search?: string;
  food_type?: string;
  species?: string;
  min_protein?: number;
  is_active?: boolean;
}): Promise<Result<Foods[]>> {
  try {
    // 1. Auth + Household context
    const { householdId } = await requireHousehold();

    // 2. Build dynamic query
    const conditions: string[] = ["household_id = $1"];
    const values: unknown[] = [householdId];
    let paramIndex = 2;

    // Active filter (default: true)
    const isActive = filters?.is_active ?? true;
    conditions.push(`is_active = $${paramIndex++}`);
    values.push(isActive);

    // Search in name, brand, ingredients
    if (filters?.search) {
      conditions.push(
        `(
          name ILIKE $${paramIndex} OR
          brand ILIKE $${paramIndex} OR
          ingredients ILIKE $${paramIndex}
        )`
      );
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Food type filter
    if (filters?.food_type) {
      conditions.push(`food_type = $${paramIndex++}`);
      values.push(filters.food_type);
    }

    // Species filter (array contains)
    if (filters?.species) {
      conditions.push(`$${paramIndex} = ANY(suitable_for_species)`);
      values.push(filters.species);
      paramIndex++;
    }

    // Minimum protein filter
    if (filters?.min_protein !== undefined) {
      conditions.push(`protein_percentage >= $${paramIndex++}`);
      values.push(filters.min_protein);
    }

    // 3. Execute query
    const result = await query(
      `SELECT * FROM foods
       WHERE ${conditions.join(" AND ")}
       ORDER BY name ASC`,
      values
    );

    return ok(result.rows as Foods[]);
  } catch (error) {
    console.error("[searchFoods] Error:", error);
    return fail(
      error instanceof Error ? error.message : "Error al buscar alimentos"
    );
  }
}
