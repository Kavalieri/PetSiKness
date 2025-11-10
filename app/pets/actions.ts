"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { ok, fail, type Result } from "@/lib/result";
import { requireHousehold } from "@/lib/auth";
import { PetFormSchema, PetIdSchema, type Pet } from "@/types/pets";

// ============================================
// GET PETS - Listar mascotas del hogar
// ============================================

/**
 * Obtiene todas las mascotas activas del hogar actual
 * @returns Result con array de mascotas
 */
export async function getPets(): Promise<Result<Pet[]>> {
  try {
    // 1. Autenticación y obtener household_id
    const { householdId } = await requireHousehold();

    // 2. Query filtrada por household_id
    const result = await query(
      `SELECT * FROM pets 
       WHERE household_id = $1 
       AND is_active = true 
       ORDER BY name ASC`,
      [householdId]
    );

    // 3. Retornar resultado
    return ok(result.rows as Pet[]);
  } catch (error) {
    console.error("Error en getPets:", error);
    return fail(
      error instanceof Error ? error.message : "Error al obtener las mascotas"
    );
  }
}

// ============================================
// GET PET BY ID - Obtener mascota específica
// ============================================

/**
 * Obtiene una mascota por su ID
 * Valida que pertenezca al hogar del usuario actual
 * @param id - UUID de la mascota
 * @returns Result con la mascota o error
 */
export async function getPetById(id: string): Promise<Result<Pet>> {
  try {
    // 1. Validar ID
    const idValidation = PetIdSchema.safeParse(id);
    if (!idValidation.success) {
      return fail("ID de mascota inválido");
    }

    // 2. Autenticación y obtener household_id
    const { householdId } = await requireHousehold();

    // 3. Query con doble filtro: id + household_id
    const result = await query(
      `SELECT * FROM pets 
       WHERE id = $1 
       AND household_id = $2 
       AND is_active = true 
       LIMIT 1`,
      [id, householdId]
    );

    // 4. Verificar que existe
    if (result.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    return ok(result.rows[0] as Pet);
  } catch (error) {
    console.error("Error en getPetById:", error);
    return fail(
      error instanceof Error ? error.message : "Error al obtener la mascota"
    );
  }
}

// ============================================
// CREATE PET - Crear nueva mascota
// ============================================

/**
 * Crea una nueva mascota en el hogar actual
 * @param formData - Datos del formulario
 * @returns Result con la mascota creada
 */
export async function createPet(formData: FormData): Promise<Result<Pet>> {
  try {
    // 1. Autenticación y obtener household_id y profile_id
    const { householdId, profileId } = await requireHousehold();

    // 2. Parsear y validar datos del formulario
    const rawData = {
      name: formData.get("name"),
      species: formData.get("species"),
      breed: formData.get("breed") || null,
      birth_date: formData.get("birth_date") || null,
      gender: formData.get("gender") || "unknown",
      weight_kg: formData.get("weight_kg")
        ? Number(formData.get("weight_kg"))
        : null,
      body_condition: formData.get("body_condition") || null,
      daily_food_goal_grams: Number(formData.get("daily_food_goal_grams")),
      daily_meals_target: formData.get("daily_meals_target")
        ? Number(formData.get("daily_meals_target"))
        : 2,
      health_notes: formData.get("health_notes") || null,
      allergies: formData.get("allergies")
        ? JSON.parse(formData.get("allergies") as string)
        : [],
      medications: formData.get("medications")
        ? JSON.parse(formData.get("medications") as string)
        : [],
      appetite: formData.get("appetite") || "normal",
      activity_level: formData.get("activity_level") || "moderate",
    };

    // 3. Validar con Zod
    const validation = PetFormSchema.safeParse(rawData);
    if (!validation.success) {
      return fail(
        "Datos de mascota inválidos",
        validation.error.flatten().fieldErrors
      );
    }

    const data = validation.data;

    // 4. Insertar en base de datos
    const result = await query(
      `INSERT INTO pets (
        household_id,
        name,
        species,
        breed,
        birth_date,
        gender,
        weight_kg,
        body_condition,
        daily_food_goal_grams,
        daily_meals_target,
        health_notes,
        allergies,
        medications,
        appetite,
        activity_level,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        householdId,
        data.name,
        data.species,
        data.breed,
        data.birth_date,
        data.gender,
        data.weight_kg,
        data.body_condition,
        data.daily_food_goal_grams,
        data.daily_meals_target,
        data.health_notes,
        data.allergies,
        data.medications,
        data.appetite,
        data.activity_level,
        profileId,
      ]
    );

    // 5. Revalidar rutas
    revalidatePath("/pets");

    return ok(result.rows[0] as Pet);
  } catch (error) {
    console.error("Error en createPet:", error);
    return fail(
      error instanceof Error ? error.message : "Error al crear la mascota"
    );
  }
}

// ============================================
// UPDATE PET - Actualizar mascota existente
// ============================================

/**
 * Actualiza una mascota existente
 * Valida que pertenezca al hogar del usuario actual
 * @param id - UUID de la mascota
 * @param formData - Datos actualizados
 * @returns Result con la mascota actualizada
 */
export async function updatePet(
  id: string,
  formData: FormData
): Promise<Result<Pet>> {
  try {
    // 1. Validar ID
    const idValidation = PetIdSchema.safeParse(id);
    if (!idValidation.success) {
      return fail("ID de mascota inválido");
    }

    // 2. Autenticación y obtener household_id
    const { householdId } = await requireHousehold();

    // 3. Verificar que la mascota existe y pertenece al hogar
    const existingPet = await query(
      `SELECT id FROM pets WHERE id = $1 AND household_id = $2 AND is_active = true`,
      [id, householdId]
    );

    if (existingPet.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    // 4. Parsear y validar datos del formulario
    const rawData = {
      name: formData.get("name"),
      species: formData.get("species"),
      breed: formData.get("breed") || null,
      birth_date: formData.get("birth_date") || null,
      gender: formData.get("gender") || "unknown",
      weight_kg: formData.get("weight_kg")
        ? Number(formData.get("weight_kg"))
        : null,
      body_condition: formData.get("body_condition") || null,
      daily_food_goal_grams: Number(formData.get("daily_food_goal_grams")),
      daily_meals_target: formData.get("daily_meals_target")
        ? Number(formData.get("daily_meals_target"))
        : 2,
      health_notes: formData.get("health_notes") || null,
      allergies: formData.get("allergies")
        ? JSON.parse(formData.get("allergies") as string)
        : [],
      medications: formData.get("medications")
        ? JSON.parse(formData.get("medications") as string)
        : [],
      appetite: formData.get("appetite") || "normal",
      activity_level: formData.get("activity_level") || "moderate",
    };

    // 5. Validar con Zod
    const validation = PetFormSchema.safeParse(rawData);
    if (!validation.success) {
      return fail(
        "Datos de mascota inválidos",
        validation.error.flatten().fieldErrors
      );
    }

    const data = validation.data;

    // 6. Actualizar en base de datos
    const result = await query(
      `UPDATE pets SET
        name = $1,
        species = $2,
        breed = $3,
        birth_date = $4,
        gender = $5,
        weight_kg = $6,
        body_condition = $7,
        daily_food_goal_grams = $8,
        daily_meals_target = $9,
        health_notes = $10,
        allergies = $11,
        medications = $12,
        appetite = $13,
        activity_level = $14,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $15 AND household_id = $16
      RETURNING *`,
      [
        data.name,
        data.species,
        data.breed,
        data.birth_date,
        data.gender,
        data.weight_kg,
        data.body_condition,
        data.daily_food_goal_grams,
        data.daily_meals_target,
        data.health_notes,
        data.allergies,
        data.medications,
        data.appetite,
        data.activity_level,
        id,
        householdId,
      ]
    );

    // 7. Revalidar rutas
    revalidatePath("/pets");
    revalidatePath(`/pets/${id}`);

    return ok(result.rows[0] as Pet);
  } catch (error) {
    console.error("Error en updatePet:", error);
    return fail(
      error instanceof Error ? error.message : "Error al actualizar la mascota"
    );
  }
}

// ============================================
// DELETE PET - Eliminar mascota (soft delete)
// ============================================

/**
 * Elimina una mascota (soft delete: is_active = false)
 * Valida que pertenezca al hogar del usuario actual
 * @param id - UUID de la mascota
 * @returns Result indicando éxito o error
 */
export async function deletePet(id: string): Promise<Result> {
  try {
    // 1. Validar ID
    const idValidation = PetIdSchema.safeParse(id);
    if (!idValidation.success) {
      return fail("ID de mascota inválido");
    }

    // 2. Autenticación y obtener household_id
    const { householdId } = await requireHousehold();

    // 3. Verificar que la mascota existe y pertenece al hogar
    const existingPet = await query(
      `SELECT id, name FROM pets WHERE id = $1 AND household_id = $2 AND is_active = true`,
      [id, householdId]
    );

    if (existingPet.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    // 4. Soft delete: marcar como inactiva
    await query(
      `UPDATE pets SET 
        is_active = false, 
        updated_at = CURRENT_TIMESTAMP 
      WHERE id = $1 AND household_id = $2`,
      [id, householdId]
    );

    // 5. Revalidar rutas
    revalidatePath("/pets");

    return ok();
  } catch (error) {
    console.error("Error en deletePet:", error);
    return fail(
      error instanceof Error ? error.message : "Error al eliminar la mascota"
    );
  }
}
