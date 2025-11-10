"use server";

import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";

// ============================================
// 🎯 FILOSOFÍA: GESTIÓN DIARIA PRIORITARIA
// ============================================
//
// Este módulo está diseñado para CONTROL DIARIO de alimentación como función principal.
//
// FOCO PRIMARIO (sin parámetros de fecha):
//   ✅ Gestión del DÍA ACTUAL (HOY)
//   ✅ Control en tiempo real
//   ✅ Alertas inmediatas
//   ✅ Toma de decisiones diarias
//
// FOCO SECUNDARIO (con parámetros opcionales de fecha):
//   📊 Análisis retrospectivo de días/semanas pasadas
//   📈 Estudio de tendencias y patrones
//   📉 Evaluación de datos agregados por rangos coherentes
//
// DISEÑO: Todas las funciones operan por defecto sobre HOY, garantizando que
// el uso principal (gestión diaria) sea simple y directo, mientras que el
// análisis histórico queda disponible como capacidad complementaria.
//
// ============================================

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

// Row raw de la DB (numeric viene como string)
interface TodayBalanceRow {
  pet_id: string;
  pet_name: string;
  total_served: string | number;
  total_eaten: string | number;
  total_leftover: string | number;
  daily_goal: number;
  achievement_pct: string | number;
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
 * 🎯 GESTIÓN DIARIA: Obtiene el resumen de alimentación del día
 * 
 * FOCO PRINCIPAL: Control diario de alimentación (HOY por defecto)
 * USO SECUNDARIO: Consulta histórica para análisis retrospectivo
 * 
 * @param date - Fecha ISO (YYYY-MM-DD). Default: HOY (gestión diaria)
 * @returns Resumen agregado por mascota del día especificado
 */
export async function getDailySummary(
  date?: string
): Promise<Result<DailySummary[]>> {
  try {
    const { householdId } = await requireHousehold();
    // DEFAULT: Día actual (gestión diaria prioritaria)
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
      WHERE p.household_id = $1 AND p.is_active = true AND dfs.feeding_date = $2
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
 * 🎯 GESTIÓN DIARIA: Balance en tiempo real de alimentación
 * 
 * Calcula directamente desde feedings (no usa vista) para datos actualizados al segundo.
 * FOCO: Monitoreo continuo del día actual para control inmediato.
 * 
 * @param date - Fecha ISO (YYYY-MM-DD). Default: HOY (uso principal: gestión diaria)
 * @returns Balance actualizado por mascota del día especificado
 */
export async function getTodayBalance(
  date?: string
): Promise<Result<TodayBalance[]>> {
  try {
    const { householdId } = await requireHousehold();
    // DEFAULT: Hoy (gestión diaria en tiempo real)
    const targetDate = date || new Date().toISOString().split("T")[0];

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
      WHERE p.household_id = $1 AND p.is_active = true
      GROUP BY p.id, p.name, p.daily_food_goal_grams
      ORDER BY p.name
      `,
      [householdId, targetDate]
    );

    // Convertir achievement_pct de string a number (PostgreSQL ROUND devuelve numeric como string)
    const balances: TodayBalance[] = result.rows.map(
      (row: TodayBalanceRow) => ({
        ...row,
        achievement_pct: parseFloat(String(row.achievement_pct || "0")),
        total_served: Number(row.total_served),
        total_eaten: Number(row.total_eaten),
        total_leftover: Number(row.total_leftover),
        daily_goal: Number(row.daily_goal),
      })
    );

    return ok(balances);
  } catch (error) {
    console.error("Error fetching today balance:", error);
    if (error instanceof Error) {
      return fail(error.message);
    }
    return fail("Error al obtener balance de hoy");
  }
}

/**
 * 🎯 GESTIÓN DIARIA: Estadísticas de tendencia semanal
 * 
 * Muestra últimos 7 días desde la fecha especificada hacia atrás.
 * FOCO: Contexto de la gestión diaria actual + tendencia reciente.
 * USO SECUNDARIO: Análisis de semanas pasadas específicas.
 * 
 * @param endDate - Fecha final ISO (YYYY-MM-DD). Default: HOY (última semana)
 * @returns Stats agregados de los últimos 7 días desde endDate
 */
export async function getWeeklyStats(
  endDate?: string
): Promise<Result<WeeklyStats[]>> {
  try {
    const { householdId } = await requireHousehold();
    // DEFAULT: Hoy (contexto de gestión diaria)
    const targetEndDate = endDate || new Date().toISOString().split("T")[0];

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
        AND p.is_active = true
        AND dfs.feeding_date <= $2::date
        AND dfs.feeding_date >= ($2::date - INTERVAL '6 days')
      GROUP BY dfs.feeding_date
      ORDER BY dfs.feeding_date DESC
      `,
      [householdId, targetEndDate]
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
 * 🎯 GESTIÓN DIARIA: Conteo de alertas críticas de alimentación
 * 
 * Identifica mascotas con alimentación insuficiente (<90% objetivo).
 * FOCO PRINCIPAL: Alertas del día actual para acción inmediata.
 * USO SECUNDARIO: Revisar alertas de días pasados.
 * 
 * @param date - Fecha ISO (YYYY-MM-DD). Default: HOY (alertas actuales)
 * @returns Número de mascotas bajo objetivo en el día especificado
 */
export async function getAlertsCount(
  date?: string
): Promise<Result<number>> {
  try {
    const { householdId } = await requireHousehold();
    // DEFAULT: Hoy (gestión de alertas diarias)
    const targetDate = date || new Date().toISOString().split("T")[0];

    const result = await query(
      `
      SELECT COUNT(*)::integer as count
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND p.is_active = true
        AND dfs.feeding_date = $2
        AND dfs.under_target = true
      `,
      [householdId, targetDate]
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
 * 🎯 GESTIÓN DIARIA: Datos de tendencia individual de mascota
 * 
 * Muestra últimos 7 días desde fecha especificada para gráfico de evolución.
 * FOCO: Contexto de gestión diaria + progreso reciente de la mascota.
 * USO SECUNDARIO: Análisis de períodos históricos específicos.
 * 
 * @param petId - ID de la mascota
 * @param endDate - Fecha final ISO (YYYY-MM-DD). Default: HOY (últimos 7 días)
 * @returns Datos diarios para gráfico de tendencia
 */
export async function getPetTrendData(
  petId: string,
  endDate?: string
): Promise<Result<PetTrendData[]>> {
  try {
    const { householdId } = await requireHousehold();

    // Verificar ownership
    const petCheck = await query(
      "SELECT id FROM pets WHERE id = $1 AND household_id = $2 AND is_active = true",
      [petId, householdId]
    );

    if (petCheck.rows.length === 0) {
      return fail("Mascota no encontrada");
    }

    // DEFAULT: Hoy (contexto de gestión diaria)
    const targetEndDate = endDate || new Date().toISOString().split("T")[0];

    const result = await query(
      `
      SELECT 
        dfs.feeding_date as date,
        dfs.total_eaten_grams as total_eaten,
        dfs.daily_food_goal_grams as daily_goal,
        dfs.goal_achievement_pct as achievement_pct
      FROM daily_feeding_summary dfs
      WHERE dfs.pet_id = $1
        AND dfs.feeding_date <= $2::date
        AND dfs.feeding_date >= ($2::date - INTERVAL '6 days')
      ORDER BY dfs.feeding_date ASC
      `,
      [petId, targetEndDate]
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
 * 🎯 GESTIÓN DIARIA: Overview general del hogar
 * 
 * Estadísticas agregadas del día actual + contexto semanal.
 * FOCO PRINCIPAL: Estado general de alimentación HOY.
 * USO SECUNDARIO: Revisar overview de días pasados.
 * 
 * @param date - Fecha ISO (YYYY-MM-DD). Default: HOY (overview diario actual)
 * @returns Estadísticas agregadas del hogar para el día especificado
 */
export async function getHouseholdOverview(
  date?: string
): Promise<Result<HouseholdOverview>> {
  try {
    const { householdId } = await requireHousehold();
    // DEFAULT: Hoy (overview de gestión diaria)
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Total de mascotas activas
    const petsResult = await query(
      "SELECT COUNT(*)::integer as count FROM pets WHERE household_id = $1 AND is_active = true",
      [householdId]
    );
    const totalPets = petsResult.rows[0]?.count || 0;

    // Mascotas on track en la fecha especificada (solo activas)
    const onTrackResult = await query(
      `
      SELECT COUNT(*)::integer as count
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND p.is_active = true
        AND dfs.feeding_date = $2
        AND dfs.met_target = true
      `,
      [householdId, targetDate]
    );
    const petsOnTrackToday = onTrackResult.rows[0]?.count || 0;

    // Total feedings últimos 7 días desde la fecha especificada
    const feedingsResult = await query(
      `
      SELECT COUNT(*)::integer as count
      FROM feedings
      WHERE household_id = $1
        AND feeding_date <= $2::date
        AND feeding_date >= ($2::date - INTERVAL '6 days')
      `,
      [householdId, targetDate]
    );
    const totalFeedingsLast7Days = feedingsResult.rows[0]?.count || 0;

    // Promedio de cumplimiento (últimos 7 días desde fecha especificada, solo mascotas activas)
    const avgResult = await query(
      `
      SELECT ROUND(AVG(goal_achievement_pct), 2) as avg
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND p.is_active = true
        AND dfs.feeding_date <= $2::date
        AND dfs.feeding_date >= ($2::date - INTERVAL '6 days')
      `,
      [householdId, targetDate]
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
