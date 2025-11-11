"use server";

import { revalidatePath } from "next/cache";
import { query } from "@/lib/db";
import { ok, fail, type Result } from "@/lib/result";
import { requireHousehold } from "@/lib/auth";
import {
  PetFormSchema,
  PetIdSchema,
  type Pet,
  type PetWithSchedules,
} from "@/types/pets";

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
 * Incluye sus horarios de tomas (meal_schedules)
 * @param id - UUID de la mascota
 * @returns Result con la mascota y sus horarios
 */
export async function getPetById(
  id: string
): Promise<Result<PetWithSchedules>> {
  try {
    // 1. Validar ID
    const idValidation = PetIdSchema.safeParse(id);
    if (!idValidation.success) {
      return fail("ID de mascota inválido");
    }

    // 2. Autenticación y obtener household_id
    const { householdId } = await requireHousehold();

    // 3. Query de mascota
    const petResult = await query(
      `SELECT * FROM pets 
       WHERE id = $1 
       AND household_id = $2 
       AND is_active = true 
       LIMIT 1`,
      [id, householdId]
    );

    // 4. Verificar que existe
    if (petResult.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    const pet = petResult.rows[0] as Pet;

    // 5. Query de meal_schedules
    const schedulesResult = await query(
      `SELECT id, meal_number, scheduled_time, expected_grams, notes, created_at, updated_at
       FROM pet_meal_schedules
       WHERE pet_id = $1
       ORDER BY meal_number ASC`,
      [id]
    );

    // 6. Combinar pet con schedules
    const petWithSchedules: PetWithSchedules = {
      ...pet,
      meal_schedules: schedulesResult.rows,
    };

    return ok(petWithSchedules);
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
      photo_url: formData.get("photo_url") || null,
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

    // 4. Parsear meal_schedules si existen
    let mealSchedules = null;
    const mealSchedulesRaw = formData.get("meal_schedules");
    if (mealSchedulesRaw) {
      try {
        mealSchedules = JSON.parse(mealSchedulesRaw as string);
      } catch {
        return fail("Formato inválido de horarios de tomas");
      }
    }

    // 5. Insertar en base de datos
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
        photo_url,
        created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
        data.photo_url,
        profileId,
      ]
    );

    const createdPet = result.rows[0] as Pet;

    // 6. Insertar meal_schedules si existen
    if (
      mealSchedules &&
      Array.isArray(mealSchedules) &&
      mealSchedules.length > 0
    ) {
      const scheduleValues = mealSchedules
        .map(
          (schedule, index) =>
            `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`
        )
        .join(", ");

      const scheduleParams = [
        createdPet.id,
        ...mealSchedules.flatMap(
          (s: {
            meal_number: number;
            scheduled_time: string;
            expected_grams?: number;
          }) => [s.meal_number, s.scheduled_time, s.expected_grams || null]
        ),
      ];

      await query(
        `INSERT INTO pet_meal_schedules (pet_id, meal_number, scheduled_time, expected_grams)
         VALUES ${scheduleValues}`,
        scheduleParams
      );

      // 🔥 NUEVO: Recalcular daily_food_goal_grams como SUMA de expected_grams
      const totalExpected = mealSchedules.reduce(
        (sum, s: { expected_grams?: number }) => sum + (s.expected_grams || 0),
        0
      );

      // Si todas las tomas tienen expected_grams configurado, actualizar daily_goal
      if (
        totalExpected > 0 &&
        mealSchedules.every(
          (s: { expected_grams?: number }) => s.expected_grams
        )
      ) {
        await query(
          `UPDATE pets SET daily_food_goal_grams = $1 WHERE id = $2`,
          [totalExpected, createdPet.id]
        );
      }
    }

    // 7. Revalidar rutas
    revalidatePath("/pets");

    return ok(createdPet);
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
      photo_url: formData.get("photo_url") || null,
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

    // 6. Parsear meal_schedules si existen
    let mealSchedules = null;
    const mealSchedulesRaw = formData.get("meal_schedules");
    if (mealSchedulesRaw) {
      try {
        mealSchedules = JSON.parse(mealSchedulesRaw as string);
      } catch {
        return fail("Formato inválido de horarios de tomas");
      }
    }

    // 7. Actualizar en base de datos
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
        photo_url = $15,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $16 AND household_id = $17
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
        data.photo_url,
        id,
        householdId,
      ]
    );

    const updatedPet = result.rows[0] as Pet;

    // 8. Actualizar meal_schedules si existen
    if (mealSchedules && Array.isArray(mealSchedules)) {
      // Primero eliminar los existentes
      await query(`DELETE FROM pet_meal_schedules WHERE pet_id = $1`, [id]);

      // Luego insertar los nuevos si hay
      if (mealSchedules.length > 0) {
        const scheduleValues = mealSchedules
          .map(
            (schedule, index) =>
              `($1, $${index * 3 + 2}, $${index * 3 + 3}, $${index * 3 + 4})`
          )
          .join(", ");

        const scheduleParams = [
          id,
          ...mealSchedules.flatMap(
            (s: {
              meal_number: number;
              scheduled_time: string;
              expected_grams?: number;
            }) => [
              s.meal_number,
              s.scheduled_time,
              s.expected_grams || null,
            ]
          ),
        ];

        await query(
          `INSERT INTO pet_meal_schedules (pet_id, meal_number, scheduled_time, expected_grams)
           VALUES ${scheduleValues}`,
          scheduleParams
        );

        // 🔥 NUEVO: Recalcular daily_food_goal_grams como SUMA de expected_grams
        const totalExpected = mealSchedules.reduce(
          (sum, s: { expected_grams?: number }) =>
            sum + (s.expected_grams || 0),
          0
        );

        // Si todas las tomas tienen expected_grams configurado, actualizar daily_goal
        if (
          totalExpected > 0 &&
          mealSchedules.every(
            (s: { expected_grams?: number }) => s.expected_grams
          )
        ) {
          await query(
            `UPDATE pets SET daily_food_goal_grams = $1 WHERE id = $2`,
            [totalExpected, id]
          );
        }
      }
    }

    // 9. Revalidar rutas
    revalidatePath("/pets");
    revalidatePath(`/pets/${id}`);

    return ok(updatedPet);
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
