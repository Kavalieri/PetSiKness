/**
 * Recommendations Actions
 * Pet SiKness - Server actions para recomendaciones nutricionales
 */

"use server";

import { query } from "@/lib/db";
import { getUserHouseholdId } from "@/lib/auth";
import { fail, ok } from "@/lib/result";
import type { Result } from "@/lib/result";
import {
  generateNutritionalRecommendations,
  type RecommendationResult,
} from "@/lib/algorithms/nutrition-recommendations";
import type { Foods, Pets } from "@/types/database.generated";

// ============================================
// SERVER ACTION: GET RECOMMENDATIONS
// ============================================

/**
 * Obtener recomendaciones nutricionales para una mascota
 *
 * @param petId - ID de la mascota (opcional, si no se proporciona usa la primera del hogar)
 * @param days - Días del período a analizar (default: 7)
 * @returns Resultado con análisis, gaps y recomendaciones
 */
export async function getRecommendationsForPet(
  petId?: string,
  days: number = 7
): Promise<Result<RecommendationResult>> {
  try {
    // 1. Obtener household del usuario
    const householdId = await getUserHouseholdId();
    if (!householdId) {
      return fail("No se encontró el hogar del usuario");
    }

    // 2. Determinar mascota target
    let targetPetId = petId;
    if (!targetPetId) {
      // Obtener primera mascota del hogar
      const petsResult = await query(
        `SELECT id FROM pets WHERE household_id = $1 LIMIT 1`,
        [householdId]
      );
      if (petsResult.rows.length === 0) {
        return fail("No hay mascotas registradas en este hogar");
      }
      targetPetId = petsResult.rows[0].id;
    }

    // 3. Obtener datos de la mascota
    const petResult = await query(
      `SELECT * FROM pets WHERE id = $1 AND household_id = $2`,
      [targetPetId, householdId]
    );

    if (petResult.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    const pet = petResult.rows[0] as Pets;

    // 4. Obtener historial de alimentación con datos nutricionales
    const feedingHistoryResult = await query(
      `
      SELECT 
        f.amount_eaten_grams,
        fd.protein_percentage,
        fd.fat_percentage,
        fd.carbs_percentage,
        fd.fiber_percentage,
        fd.moisture_percentage,
        fd.calories_per_100g
      FROM feedings f
      INNER JOIN foods fd ON f.food_id = fd.id
      WHERE f.pet_id = $1
        AND f.feeding_date >= CURRENT_DATE - $2::INTEGER
      ORDER BY f.feeding_date DESC, f.feeding_time DESC
      `,
      [targetPetId, days]
    );

    if (feedingHistoryResult.rows.length === 0) {
      return fail(
        `No hay historial de alimentación en los últimos ${days} días`
      );
    }

    // 5. Obtener catálogo de alimentos disponibles en el hogar
    const foodsResult = await query(
      `
      SELECT * FROM foods 
      WHERE household_id = $1
      ORDER BY name
      `,
      [householdId]
    );

    if (foodsResult.rows.length === 0) {
      return fail("No hay alimentos registrados en el catálogo");
    }

    const availableFoods = foodsResult.rows as Foods[];

    // 6. Transformar historial a formato esperado por el algoritmo
    interface FeedingRow {
      amount_eaten_grams: number;
      protein_percentage: number | null;
      fat_percentage: number | null;
      carbs_percentage: number | null;
      fiber_percentage: number | null;
      moisture_percentage: number | null;
      calories_per_100g: number | null;
    }

    const feedingHistory = feedingHistoryResult.rows.map((row: FeedingRow) => ({
      amount_eaten_grams: row.amount_eaten_grams,
      food: {
        protein_percentage: row.protein_percentage,
        fat_percentage: row.fat_percentage,
        carbs_percentage: row.carbs_percentage,
        fiber_percentage: row.fiber_percentage,
        moisture_percentage: row.moisture_percentage,
        calories_per_100g: row.calories_per_100g,
      },
    }));

    // 7. Generar recomendaciones usando el algoritmo
    const recommendations = generateNutritionalRecommendations(
      feedingHistory,
      pet,
      availableFoods,
      days
    );

    return ok(recommendations);
  } catch (error) {
    console.error("Error al generar recomendaciones:", error);
    return fail("Error al generar recomendaciones nutricionales");
  }
}

// ============================================
// SERVER ACTION: GET PETS FOR RECOMMENDATIONS
// ============================================

/**
 * Obtener lista de mascotas del hogar para selector
 */
export async function getPetsForRecommendations(): Promise<
  Result<Array<{ id: string; name: string; species: string }>>
> {
  try {
    const householdId = await getUserHouseholdId();
    if (!householdId) {
      return fail("No se encontró el hogar del usuario");
    }

    const petsResult = await query(
      `
      SELECT id, name, species 
      FROM pets 
      WHERE household_id = $1
      ORDER BY name
      `,
      [householdId]
    );

    return ok(
      petsResult.rows as Array<{ id: string; name: string; species: string }>
    );
  } catch (error) {
    console.error("Error al obtener mascotas:", error);
    return fail("Error al obtener lista de mascotas");
  }
}
