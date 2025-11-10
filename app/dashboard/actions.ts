"use server";

import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";

// ============================================
// TIPOS
// ============================================

interface DailySummary {
  pet_id: string;
  pet_name: string;
  feeding_date: string;
  total_served_grams: number;
  total_eaten_grams: number;
  total_leftover_grams: number;
  daily_food_goal_grams: number;
  goal_achievement_pct: number;
  under_target: boolean;
  met_target: boolean;
  over_target: boolean;
}

interface TodayBalance {
  pet_id: string;
  pet_name: string;
  total_served: number;
  total_eaten: number;
  total_leftover: number;
  daily_goal: number;
  achievement_pct: number;
  status: "under" | "met" | "over";
}

interface WeeklyStats {
  date: string;
  total_eaten: number;
  avg_achievement_pct: number;
  days_on_track: number;
}

interface PetTrendData {
  date: string;
  total_eaten: number;
  daily_goal: number;
  achievement_pct: number;
}

interface HouseholdOverview {
  total_pets: number;
  pets_on_track_today: number;
  total_feedings_last_7_days: number;
  avg_achievement_pct: number;
}

// ============================================
// ACCIONES - ANALYTICS
// ============================================

/**
 * Obtiene el resumen diario de alimentación desde la vista
 * Usa daily_feeding_summary view
 */
export async function getDailySummary(
  date?: string
): Promise<Result<DailySummary[]>> {
  try {
    const { householdId } = await requireHousehold();
    const targetDate = date || new Date().toISOString().split("T")[0];

    const result = await query(
      `
      SELECT 
        dfs.pet_id,
        dfs.pet_name,
        dfs.feeding_date,
        dfs.total_served_grams,
        dfs.total_eaten_grams,
        dfs.total_leftover_grams,
        dfs.daily_food_goal_grams,
        dfs.goal_achievement_pct,
        dfs.under_target,
        dfs.met_target,
        dfs.over_target
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1 AND dfs.feeding_date = $2
      ORDER BY dfs.pet_name
      `,
      [householdId, targetDate]
    );

    return ok(result.rows as DailySummary[]);
  } catch (error) {
    console.error("Error fetching daily summary:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener resumen diario");
  }
}

/**
 * Obtiene el balance de hoy para todas las mascotas
 * Calcula desde feedings directamente para tener datos en tiempo real
 */
export async function getTodayBalance(): Promise<Result<TodayBalance[]>> {
  try {
    const { householdId } = await requireHousehold();
    const today = new Date().toISOString().split("T")[0];

    const result = await query(
      `
      SELECT 
        p.id as pet_id,
        p.name as pet_name,
        COALESCE(SUM(f.amount_served_grams), 0) as total_served,
        COALESCE(SUM(f.amount_eaten_grams), 0) as total_eaten,
        COALESCE(SUM(f.amount_leftover_grams), 0) as total_leftover,
        p.daily_food_goal_grams as daily_goal,
        CASE 
          WHEN p.daily_food_goal_grams > 0 
          THEN ROUND((COALESCE(SUM(f.amount_eaten_grams), 0)::DECIMAL / p.daily_food_goal_grams) * 100, 2)
          ELSE 0
        END as achievement_pct,
        CASE
          WHEN COALESCE(SUM(f.amount_eaten_grams), 0) < p.daily_food_goal_grams * 0.9 THEN 'under'
          WHEN COALESCE(SUM(f.amount_eaten_grams), 0) BETWEEN p.daily_food_goal_grams * 0.9 AND p.daily_food_goal_grams * 1.1 THEN 'met'
          ELSE 'over'
        END as status
      FROM pets p
      LEFT JOIN feedings f ON f.pet_id = p.id AND f.feeding_date = $2
      WHERE p.household_id = $1
      GROUP BY p.id, p.name, p.daily_food_goal_grams
      ORDER BY p.name
      `,
      [householdId, today]
    );

    return ok(result.rows as TodayBalance[]);
  } catch (error) {
    console.error("Error fetching today balance:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener balance de hoy");
  }
}

/**
 * Obtiene estadísticas semanales agregadas
 * Últimos 7 días de datos
 */
export async function getWeeklyStats(): Promise<Result<WeeklyStats[]>> {
  try {
    const { householdId } = await requireHousehold();

    const result = await query(
      `
      SELECT 
        dfs.feeding_date as date,
        SUM(dfs.total_eaten_grams) as total_eaten,
        ROUND(AVG(dfs.goal_achievement_pct), 2) as avg_achievement_pct,
        COUNT(*) FILTER (WHERE dfs.met_target = true) as days_on_track
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND dfs.feeding_date >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY dfs.feeding_date
      ORDER BY dfs.feeding_date DESC
      `,
      [householdId]
    );

    return ok(result.rows as WeeklyStats[]);
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener estadísticas semanales");
  }
}

/**
 * Cuenta alertas críticas (mascotas bajo objetivo hoy)
 */
export async function getAlertsCount(): Promise<Result<number>> {
  try {
    const { householdId } = await requireHousehold();
    const today = new Date().toISOString().split("T")[0];

    const result = await query(
      `
      SELECT COUNT(*)::integer as count
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND dfs.feeding_date = $2
        AND dfs.under_target = true
      `,
      [householdId, today]
    );

    return ok(result.rows[0]?.count || 0);
  } catch (error) {
    console.error("Error fetching alerts count:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener alertas");
  }
}

/**
 * Obtiene datos de tendencia para una mascota específica
 * Últimos 7 días
 */
export async function getPetTrendData(
  petId: string
): Promise<Result<PetTrendData[]>> {
  try {
    const { householdId } = await requireHousehold();

    // Verificar ownership
    const petCheck = await query(
      "SELECT id FROM pets WHERE id = $1 AND household_id = $2",
      [petId, householdId]
    );

    if (petCheck.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    const result = await query(
      `
      SELECT 
        dfs.feeding_date as date,
        dfs.total_eaten_grams as total_eaten,
        dfs.daily_food_goal_grams as daily_goal,
        dfs.goal_achievement_pct as achievement_pct
      FROM daily_feeding_summary dfs
      WHERE dfs.pet_id = $1
        AND dfs.feeding_date >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY dfs.feeding_date ASC
      `,
      [petId]
    );

    return ok(result.rows as PetTrendData[]);
  } catch (error) {
    console.error("Error fetching pet trend data:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener datos de tendencia");
  }
}

/**
 * Obtiene overview general del household
 * Estadísticas agregadas para dashboard principal
 */
export async function getHouseholdOverview(): Promise<
  Result<HouseholdOverview>
> {
  try {
    const { householdId } = await requireHousehold();
    const today = new Date().toISOString().split("T")[0];

    // Total de mascotas
    const petsResult = await query(
      "SELECT COUNT(*)::integer as count FROM pets WHERE household_id = $1",
      [householdId]
    );
    const totalPets = petsResult.rows[0]?.count || 0;

    // Mascotas on track hoy
    const onTrackResult = await query(
      `
      SELECT COUNT(*)::integer as count
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND dfs.feeding_date = $2
        AND dfs.met_target = true
      `,
      [householdId, today]
    );
    const petsOnTrackToday = onTrackResult.rows[0]?.count || 0;

    // Total feedings últimos 7 días
    const feedingsResult = await query(
      `
      SELECT COUNT(*)::integer as count
      FROM feedings
      WHERE household_id = $1
        AND feeding_date >= CURRENT_DATE - INTERVAL '7 days'
      `,
      [householdId]
    );
    const totalFeedingsLast7Days = feedingsResult.rows[0]?.count || 0;

    // Promedio de cumplimiento (últimos 7 días)
    const avgResult = await query(
      `
      SELECT ROUND(AVG(goal_achievement_pct), 2) as avg
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND dfs.feeding_date >= CURRENT_DATE - INTERVAL '7 days'
      `,
      [householdId]
    );
    const avgAchievementPct = avgResult.rows[0]?.avg || 0;

    const overview: HouseholdOverview = {
      total_pets: totalPets,
      pets_on_track_today: petsOnTrackToday,
      total_feedings_last_7_days: totalFeedingsLast7Days,
      avg_achievement_pct: avgAchievementPct,
    };

    return ok(overview);
  } catch (error) {
    console.error("Error fetching household overview:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener overview del hogar");
  }
}
