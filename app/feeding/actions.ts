"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";

// ============================================
// SCHEMAS DE VALIDACIÓN
// ============================================

const FeedingSchema = z
  .object({
    pet_id: z.string().uuid("ID de mascota inválido"),
    food_id: z.string().uuid("ID de alimento inválido"),
    feeding_date: z.string().min(1, "Fecha requerida"),
    feeding_time: z.string().optional(),
    meal_number: z.coerce.number().int().positive().optional(),
    amount_served_grams: z.coerce
      .number()
      .int()
      .positive("Cantidad servida debe ser mayor a 0"),
    amount_eaten_grams: z.coerce
      .number()
      .int()
      .min(0, "Cantidad comida no puede ser negativa"),
    appetite_rating: z
      .enum(["refused", "poor", "normal", "good", "excellent"])
      .optional(),
    eating_speed: z
      .enum(["very_slow", "slow", "normal", "fast", "very_fast"])
      .optional(),
    vomited: z.boolean().optional(),
    had_diarrhea: z.boolean().optional(),
    had_stool: z.boolean().optional(),
    stool_quality: z.enum(["liquid", "soft", "normal", "hard"]).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.amount_eaten_grams <= data.amount_served_grams, {
    message: "La cantidad comida no puede ser mayor a la cantidad servida",
    path: ["amount_eaten_grams"],
  });

// ============================================
// TIPOS
// ============================================

interface FeedingWithRelations {
  id: string;
  household_id: string;
  pet_id: string;
  pet_name: string;
  food_id: string;
  food_name: string;
  feeding_date: string;
  feeding_time: string | null;
  meal_number: number | null;
  amount_served_grams: number;
  amount_eaten_grams: number;
  amount_leftover_grams: number | null;
  appetite_rating: string | null;
  eating_speed: string | null;
  vomited: boolean | null;
  had_diarrhea: boolean | null;
  had_stool: boolean | null;
  stool_quality: string | null;
  notes: string | null;
  created_at: Date;
}

interface GetFeedingsFilters {
  petId?: string;
  foodId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

// ============================================
// ACCIONES - READ
// ============================================

/**
 * Obtiene lista de feedings con filtros opcionales
 */
export async function getFeedings(
  filters: GetFeedingsFilters = {}
): Promise<Result<FeedingWithRelations[]>> {
  try {
    const { householdId } = await requireHousehold();
    const { petId, foodId, startDate, endDate, limit = 100 } = filters;

    let sql = `
      SELECT 
        f.id,
        f.household_id,
        f.pet_id,
        p.name as pet_name,
        f.food_id,
        fo.name as food_name,
        f.feeding_date,
        f.feeding_time,
        f.meal_number,
        f.amount_served_grams,
        f.amount_eaten_grams,
        f.amount_leftover_grams,
        f.appetite_rating,
        f.eating_speed,
        f.vomited,
        f.had_diarrhea,
        f.had_stool,
        f.stool_quality,
        f.notes,
        f.created_at
      FROM feedings f
      JOIN pets p ON p.id = f.pet_id
      JOIN foods fo ON fo.id = f.food_id
      WHERE f.household_id = $1
    `;

    const params: (string | number)[] = [householdId];
    let paramIndex = 2;

    if (petId) {
      sql += ` AND f.pet_id = $${paramIndex}`;
      params.push(petId);
      paramIndex++;
    }

    if (foodId) {
      sql += ` AND f.food_id = $${paramIndex}`;
      params.push(foodId);
      paramIndex++;
    }

    if (startDate) {
      sql += ` AND f.feeding_date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    if (endDate) {
      sql += ` AND f.feeding_date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    sql += ` ORDER BY f.feeding_date DESC, f.feeding_time DESC NULLS LAST LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await query(sql, params);

    return ok(result.rows as FeedingWithRelations[]);
  } catch (error) {
    console.error("Error fetching feedings:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener alimentaciones");
  }
}

/**
 * Obtiene un feeding por ID
 */
export async function getFeedingById(
  id: string
): Promise<Result<FeedingWithRelations>> {
  try {
    const { householdId } = await requireHousehold();

    const result = await query(
      `
      SELECT 
        f.id,
        f.household_id,
        f.pet_id,
        p.name as pet_name,
        f.food_id,
        fo.name as food_name,
        f.feeding_date,
        f.feeding_time,
        f.meal_number,
        f.amount_served_grams,
        f.amount_eaten_grams,
        f.amount_leftover_grams,
        f.appetite_rating,
        f.eating_speed,
        f.vomited,
        f.had_diarrhea,
        f.had_stool,
        f.stool_quality,
        f.notes,
        f.created_at
      FROM feedings f
      JOIN pets p ON p.id = f.pet_id
      JOIN foods fo ON fo.id = f.food_id
      WHERE f.id = $1 AND f.household_id = $2
      `,
      [id, householdId]
    );

    if (result.rows.length === 0) {
      return fail("Registro de alimentación no encontrado");
    }

    return ok(result.rows[0] as FeedingWithRelations);
  } catch (error) {
    console.error("Error fetching feeding by id:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener registro de alimentación");
  }
}

/**
 * Obtiene feedings de hoy, opcionalmente filtrados por pet
 */
export async function getTodayFeedings(
  petId?: string
): Promise<Result<FeedingWithRelations[]>> {
  try {
    const { householdId } = await requireHousehold();
    const today = new Date().toISOString().split("T")[0];

    let sql = `
      SELECT 
        f.id,
        f.household_id,
        f.pet_id,
        p.name as pet_name,
        f.food_id,
        fo.name as food_name,
        f.feeding_date,
        f.feeding_time,
        f.meal_number,
        f.amount_served_grams,
        f.amount_eaten_grams,
        f.amount_leftover_grams,
        f.appetite_rating,
        f.eating_speed,
        f.vomited,
        f.had_diarrhea,
        f.had_stool,
        f.stool_quality,
        f.notes,
        f.created_at
      FROM feedings f
      JOIN pets p ON p.id = f.pet_id
      JOIN foods fo ON fo.id = f.food_id
      WHERE f.household_id = $1 AND f.feeding_date = $2
    `;

    const params: (string | number)[] = [householdId, today];

    if (petId) {
      sql += ` AND f.pet_id = $3`;
      params.push(petId);
    }

    sql += ` ORDER BY f.feeding_time DESC NULLS LAST`;

    const result = await query(sql, params);

    return ok(result.rows as FeedingWithRelations[]);
  } catch (error) {
    console.error("Error fetching today's feedings:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener alimentaciones de hoy");
  }
}

// ============================================
// ACCIONES - CREATE
// ============================================

/**
 * Crea un nuevo registro de alimentación
 */
export async function createFeeding(formData: FormData): Promise<Result> {
  try {
    const { householdId } = await requireHousehold();

    // Preparar datos
    const data = {
      pet_id: formData.get("pet_id"),
      food_id: formData.get("food_id"),
      feeding_date: formData.get("feeding_date"),
      feeding_time: formData.get("feeding_time") || undefined,
      meal_number: formData.get("meal_number") || undefined,
      amount_served_grams: formData.get("amount_served_grams"),
      amount_eaten_grams: formData.get("amount_eaten_grams"),
      appetite_rating: formData.get("appetite_rating") || undefined,
      eating_speed: formData.get("eating_speed") || undefined,
      vomited: formData.get("vomited") === "true",
      had_diarrhea: formData.get("had_diarrhea") === "true",
      had_stool: formData.get("had_stool") === "true",
      stool_quality: formData.get("stool_quality") || undefined,
      notes: formData.get("notes") || undefined,
    };

    // Validación
    const parsed = FeedingSchema.safeParse(data);
    if (!parsed.success) {
      return fail(
        "Datos inválidos. Por favor verifica los campos.",
        parsed.error.flatten().fieldErrors
      );
    }

    const validated = parsed.data;

    // Verificar que pet y food pertenecen al household
    const petCheck = await query(
      "SELECT id FROM pets WHERE id = $1 AND household_id = $2",
      [validated.pet_id, householdId]
    );

    if (petCheck.rows.length === 0) {
      return fail("Mascota no encontrada o no pertenece a tu hogar");
    }

    const foodCheck = await query(
      "SELECT id FROM foods WHERE id = $1 AND household_id = $2",
      [validated.food_id, householdId]
    );

    if (foodCheck.rows.length === 0) {
      return fail("Alimento no encontrado o no pertenece a tu hogar");
    }

    // Insertar feeding
    await query(
      `
      INSERT INTO feedings (
        household_id, pet_id, food_id, feeding_date, feeding_time, meal_number,
        amount_served_grams, amount_eaten_grams,
        appetite_rating, eating_speed, vomited, had_diarrhea, had_stool, stool_quality, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      `,
      [
        householdId,
        validated.pet_id,
        validated.food_id,
        validated.feeding_date,
        validated.feeding_time || null,
        validated.meal_number || null,
        validated.amount_served_grams,
        validated.amount_eaten_grams,
        validated.appetite_rating || null,
        validated.eating_speed || null,
        validated.vomited || false,
        validated.had_diarrhea || false,
        validated.had_stool || false,
        validated.stool_quality || null,
        validated.notes || null,
      ]
    );

    revalidatePath("/dashboard");
    revalidatePath("/feeding");

    return ok();
  } catch (error) {
    console.error("Error creating feeding:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al registrar alimentación");
  }
}

// ============================================
// ACCIONES - UPDATE
// ============================================

/**
 * Actualiza un registro de alimentación existente
 */
export async function updateFeeding(formData: FormData): Promise<Result> {
  try {
    const { householdId } = await requireHousehold();

    // Obtener ID
    const id = formData.get("id") as string;
    if (!id) {
      return fail("ID de alimentación requerido");
    }

    // Verificar ownership
    const feedingCheck = await query(
      "SELECT id FROM feedings WHERE id = $1 AND household_id = $2",
      [id, householdId]
    );

    if (feedingCheck.rows.length === 0) {
      return fail("Registro no encontrado o no tienes permiso para editarlo");
    }

    // Preparar datos (pet_id y food_id no se actualizan)
    const data = {
      pet_id: formData.get("pet_id"), // Necesario para validación
      food_id: formData.get("food_id"), // Necesario para validación
      feeding_date: formData.get("feeding_date"),
      feeding_time: formData.get("feeding_time") || undefined,
      meal_number: formData.get("meal_number") || undefined,
      amount_served_grams: formData.get("amount_served_grams"),
      amount_eaten_grams: formData.get("amount_eaten_grams"),
      appetite_rating: formData.get("appetite_rating") || undefined,
      eating_speed: formData.get("eating_speed") || undefined,
      vomited: formData.get("vomited") === "true",
      had_diarrhea: formData.get("had_diarrhea") === "true",
      had_stool: formData.get("had_stool") === "true",
      stool_quality: formData.get("stool_quality") || undefined,
      notes: formData.get("notes") || undefined,
    };

    // Validación
    const parsed = FeedingSchema.safeParse(data);
    if (!parsed.success) {
      return fail(
        "Datos inválidos. Por favor verifica los campos.",
        parsed.error.flatten().fieldErrors
      );
    }

    const validated = parsed.data;

    // Actualizar (sin cambiar pet_id ni food_id)
    await query(
      `
      UPDATE feedings SET
        feeding_date = $1,
        feeding_time = $2,
        meal_number = $3,
        amount_served_grams = $4,
        amount_eaten_grams = $5,
        appetite_rating = $6,
        eating_speed = $7,
        vomited = $8,
        had_diarrhea = $9,
        had_stool = $10,
        stool_quality = $11,
        notes = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND household_id = $14
      `,
      [
        validated.feeding_date,
        validated.feeding_time || null,
        validated.meal_number || null,
        validated.amount_served_grams,
        validated.amount_eaten_grams,
        validated.appetite_rating || null,
        validated.eating_speed || null,
        validated.vomited || false,
        validated.had_diarrhea || false,
        validated.had_stool || false,
        validated.stool_quality || null,
        validated.notes || null,
        id,
        householdId,
      ]
    );

    revalidatePath("/dashboard");
    revalidatePath("/feeding");
    revalidatePath(`/feeding/${id}/edit`);

    return ok();
  } catch (error) {
    console.error("Error updating feeding:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al actualizar alimentación");
  }
}

// ============================================
// ACCIONES - DELETE
// ============================================

/**
 * Elimina un registro de alimentación
 */
export async function deleteFeeding(id: string): Promise<Result> {
  try {
    const { householdId } = await requireHousehold();

    // Verificar ownership
    const feedingCheck = await query(
      "SELECT id FROM feedings WHERE id = $1 AND household_id = $2",
      [id, householdId]
    );

    if (feedingCheck.rows.length === 0) {
      return fail("Registro no encontrado o no tienes permiso para eliminarlo");
    }

    // Eliminar
    await query("DELETE FROM feedings WHERE id = $1 AND household_id = $2", [
      id,
      householdId,
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/feeding");

    return ok();
  } catch (error) {
    console.error("Error deleting feeding:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al eliminar alimentación");
  }
}
