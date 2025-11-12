"use server";

import { query } from "@/lib/db";
import { getUserHouseholdId } from "@/lib/auth";
import type { Result } from "@/lib/result";
import { ok, fail } from "@/lib/result";

// ============================================
// TYPES
// ============================================

/**
 * Tipos de filas de base de datos
 */
interface DailyConsumptionRow {
  feeding_date: Date;
  total_served: string;
  total_eaten: string;
  total_leftover: string;
  daily_goal: string;
}

interface MacroDistributionRow {
  total_protein: string;
  total_fat: string;
  total_carbs: string;
}

interface FeedingHistoryRow {
  id: string;
  feeding_date: Date;
  feeding_time: string | null;
  pet_name: string;
  food_name: string;
  amount_served_grams: number;
  amount_eaten_grams: number;
  amount_leftover_grams: number;
  meal_number: number | null;
  appetite_rating: string | null;
}

/**
 * Punto de datos para gráfico de consumo diario
 */
export interface DailyConsumptionData {
  date: string; // YYYY-MM-DD
  served: number; // gramos servidos
  eaten: number; // gramos comidos
  leftover: number; // gramos sobrantes
  goal: number; // meta diaria
  compliancePercentage: number; // % cumplimiento
}

/**
 * Datos de distribución de macronutrientes
 */
export interface MacroDistributionData {
  name: string; // Proteína, Grasa, Carbohidratos
  value: number; // gramos
  percentage: number; // % del total
}

/**
 * Datos de historial de alimentación
 */
export interface FeedingHistoryData {
  id: string;
  date: string;
  time: string;
  petName: string;
  foodName: string;
  served: number;
  eaten: number;
  leftover: number;
  portionNumber: number;
  appetiteRating: string | null;
}

// ============================================
// CONSUMPTION TREND
// ============================================

/**
 * Obtiene datos de consumo diario para un rango de fechas
 *
 * @param petId - ID de la mascota (opcional, si no se especifica trae todas)
 * @param days - Número de días hacia atrás (default: 7)
 * @returns Array de datos diarios de consumo
 */
export async function getDailyConsumptionTrend(
  petId?: string,
  days: number = 7
): Promise<Result<DailyConsumptionData[]>> {
  try {
    const householdId = await getUserHouseholdId();
    if (!householdId) {
      return fail("No se pudo determinar el hogar activo");
    }

    const petFilter = petId ? "AND f.pet_id = $3" : "";
    const params = petId ? [householdId, days, petId] : [householdId, days];

    const result = await query(
      `
      SELECT 
        f.feeding_date,
        COALESCE(SUM(f.amount_served_grams), 0) as total_served,
        COALESCE(SUM(f.amount_eaten_grams), 0) as total_eaten,
        COALESCE(SUM(f.amount_leftover_grams), 0) as total_leftover,
        COALESCE(AVG(p.daily_food_goal_grams), 0) as daily_goal
      FROM feedings f
      INNER JOIN pets p ON p.id = f.pet_id
      WHERE f.household_id = $1
        AND f.feeding_date >= CURRENT_DATE - INTERVAL '${days} days'
        ${petFilter}
      GROUP BY f.feeding_date
      ORDER BY f.feeding_date ASC
      `,
      params
    );

    const data: DailyConsumptionData[] = result.rows.map(
      (row: DailyConsumptionRow) => {
        const served = parseInt(row.total_served);
        const eaten = parseInt(row.total_eaten);
        const leftover = parseInt(row.total_leftover);
        const goal = parseInt(row.daily_goal);

        return {
          date: row.feeding_date.toISOString().split("T")[0],
          served,
          eaten,
          leftover,
          goal,
          compliancePercentage: goal > 0 ? (served / goal) * 100 : 0,
        };
      }
    );

    return ok(data);
  } catch (error) {
    console.error("Error fetching daily consumption trend:", error);
    return fail("Error al obtener tendencia de consumo");
  }
}

// ============================================
// MACRO DISTRIBUTION
// ============================================

/**
 * Obtiene distribución de macronutrientes para una mascota
 *
 * @param petId - ID de la mascota
 * @param days - Número de días hacia atrás (default: 30)
 * @returns Distribución de proteína, grasa y carbohidratos
 */
export async function getMacroDistribution(
  petId: string,
  days: number = 30
): Promise<Result<MacroDistributionData[]>> {
  try {
    const householdId = await getUserHouseholdId();
    if (!householdId) {
      return fail("No se pudo determinar el hogar activo");
    }

    const result = await query(
      `
      SELECT 
        COALESCE(SUM(
          (f.amount_eaten_grams / 100.0) * COALESCE(fd.protein_percentage, 0)
        ), 0) as total_protein,
        COALESCE(SUM(
          (f.amount_eaten_grams / 100.0) * COALESCE(fd.fat_percentage, 0)
        ), 0) as total_fat,
        COALESCE(SUM(
          (f.amount_eaten_grams / 100.0) * COALESCE(fd.carbs_percentage, 0)
        ), 0) as total_carbs
      FROM feedings f
      INNER JOIN foods fd ON fd.id = f.food_id
      WHERE f.household_id = $1
        AND f.pet_id = $2
        AND f.feeding_date >= CURRENT_DATE - INTERVAL '${days} days'
      `,
      [householdId, petId]
    );

    if (result.rows.length === 0) {
      return ok([]);
    }

    const row = result.rows[0] as MacroDistributionRow;
    const protein = parseFloat(row.total_protein);
    const fat = parseFloat(row.total_fat);
    const carbs = parseFloat(row.total_carbs);
    const total = protein + fat + carbs;

    if (total === 0) {
      return ok([]);
    }

    const data: MacroDistributionData[] = [
      {
        name: "Proteína",
        value: protein,
        percentage: (protein / total) * 100,
      },
      {
        name: "Grasa",
        value: fat,
        percentage: (fat / total) * 100,
      },
      {
        name: "Carbohidratos",
        value: carbs,
        percentage: (carbs / total) * 100,
      },
    ];

    return ok(data);
  } catch (error) {
    console.error("Error fetching macro distribution:", error);
    return fail("Error al obtener distribución de macronutrientes");
  }
}

// ============================================
// FEEDING HISTORY
// ============================================

/**
 * Obtiene historial de alimentación con paginación
 *
 * @param petId - ID de la mascota (opcional)
 * @param limit - Número de registros (default: 50)
 * @param offset - Desplazamiento (default: 0)
 * @returns Historial de alimentaciones
 */
export async function getFeedingHistory(
  petId?: string,
  limit: number = 50,
  offset: number = 0
): Promise<Result<FeedingHistoryData[]>> {
  try {
    const householdId = await getUserHouseholdId();
    if (!householdId) {
      return fail("No se pudo determinar el hogar activo");
    }

    const petFilter = petId ? "AND f.pet_id = $4" : "";
    const params = petId
      ? [householdId, limit, offset, petId]
      : [householdId, limit, offset];

    const result = await query(
      `
      SELECT 
        f.id,
        f.feeding_date,
        f.feeding_time,
        p.name as pet_name,
        fd.name as food_name,
        f.amount_served_grams,
        f.amount_eaten_grams,
        f.amount_leftover_grams,
        f.meal_number,
        f.appetite_rating
      FROM feedings f
      INNER JOIN pets p ON p.id = f.pet_id
      INNER JOIN foods fd ON fd.id = f.food_id
      WHERE f.household_id = $1
        ${petFilter}
      ORDER BY f.feeding_date DESC, f.feeding_time DESC
      LIMIT $2 OFFSET $3
      `,
      params
    );

    const data: FeedingHistoryData[] = result.rows.map(
      (row: FeedingHistoryRow) => ({
        id: row.id,
        date: row.feeding_date.toISOString().split("T")[0],
        time: row.feeding_time || "N/A",
        petName: row.pet_name,
        foodName: row.food_name,
        served: row.amount_served_grams,
        eaten: row.amount_eaten_grams,
        leftover: row.amount_leftover_grams,
        portionNumber: row.meal_number || 0,
        appetiteRating: row.appetite_rating,
      })
    );

    return ok(data);
  } catch (error) {
    console.error("Error fetching feeding history:", error);
    return fail("Error al obtener historial de alimentación");
  }
}
