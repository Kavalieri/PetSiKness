"use server";

import { z } from "zod";
import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";
import {
  calculateMealBalances,
  type MealBalance,
} from "@/lib/utils/meal-balance";

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

export interface TodayBalance {
  pet_id: string;
  pet_name: string;
  total_served: number;
  total_eaten: number;
  total_leftover: number;
  daily_goal: number;
  achievement_pct: number;
  status: "under" | "met" | "over";
  meal_balances?: MealBalance[]; // ✨ NUEVO: Balances por toma
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
  days_with_data: number; // ✨ NUEVO: Días con registros
  total_days: number; // ✨ NUEVO: Total de días en el rango
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
  yesterday_achievement_pct: number; // Cambio: cumplimiento del día anterior (día completo)
}

// ============================================
// VALIDACIÓN ZOD
// ============================================

/**
 * Valida fecha en formato ISO YYYY-MM-DD
 */
const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato ISO (YYYY-MM-DD)")
  .refine(
    (date) => {
      const parsed = new Date(date);
      return !isNaN(parsed.getTime());
    },
    { message: "Fecha inválida" }
  )
  .optional();

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
    // Validación de parámetros
    if (date) {
      const validation = DateSchema.safeParse(date);
      if (!validation.success) {
        return fail(validation.error.errors[0]?.message || "Fecha inválida");
      }
    }

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
    // Validación de parámetros
    if (date) {
      const validation = DateSchema.safeParse(date);
      if (!validation.success) {
        return fail(validation.error.errors[0]?.message || "Fecha inválida");
      }
    }

    const { householdId } = await requireHousehold();
    // DEFAULT: Hoy (gestión diaria en tiempo real)
    const targetDate = date || new Date().toISOString().split("T")[0];

    // Query principal: balance general por mascota
    const result = await query(
      `
      SELECT 
        p.id as pet_id,
        p.name as pet_name,
        COALESCE(SUM(f.amount_served_grams), 0) as total_served,
        COALESCE(SUM(f.amount_eaten_grams), 0) as total_eaten,
        COALESCE(SUM(f.amount_leftover_grams), 0) as total_leftover,
        p.daily_food_goal_grams as daily_goal,
        p.daily_meals_target as num_meals,
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
      GROUP BY p.id, p.name, p.daily_food_goal_grams, p.daily_meals_target
      ORDER BY p.name
      `,
      [householdId, targetDate]
    );

    // ✨ NUEVO: Obtener meal schedules de todas las mascotas activas
    const schedulesResult = await query(
      `
      SELECT 
        pms.pet_id,
        pms.portion_number,
        pms.scheduled_time,
        pms.expected_grams,
        pms.notes
      FROM pet_portion_schedules pms
      INNER JOIN pets p ON p.id = pms.pet_id
      WHERE p.household_id = $1 AND p.is_active = true
      ORDER BY pms.pet_id, pms.portion_number
      `,
      [householdId]
    );

    // ✨ NUEVO: Obtener feedings del día con hora
    const feedingsResult = await query(
      `
      SELECT 
        f.pet_id,
        f.feeding_time,
        f.amount_served_grams,
        f.amount_eaten_grams
      FROM feedings f
      INNER JOIN pets p ON p.id = f.pet_id
      WHERE p.household_id = $1 
        AND f.feeding_date = $2
        AND p.is_active = true
      ORDER BY f.pet_id, f.feeding_time
      `,
      [householdId, targetDate]
    );

    // Agrupar schedules por pet_id
    const schedulesByPet = new Map<
      string,
      Array<{
        meal_number: number;
        scheduled_time: string;
        expected_grams?: number;
        notes?: string;
      }>
    >();
    for (const row of schedulesResult.rows) {
      const petId = row.pet_id as string;
      if (!schedulesByPet.has(petId)) {
        schedulesByPet.set(petId, []);
      }
      schedulesByPet.get(petId)!.push({
        meal_number: row.portion_number, // ⚠️ La columna en BD es portion_number
        scheduled_time: row.scheduled_time,
        expected_grams:
          row.expected_grams != null ? Number(row.expected_grams) : undefined,
        notes: row.notes || undefined,
      });
    }

    // Agrupar feedings por pet_id
    const feedingsByPet = new Map<
      string,
      Array<{
        feeding_time: string;
        amount_served_grams: number; // ✨ NUEVO
        amount_eaten_grams: number;
      }>
    >();
    for (const row of feedingsResult.rows) {
      const petId = row.pet_id as string;
      if (!feedingsByPet.has(petId)) {
        feedingsByPet.set(petId, []);
      }
      feedingsByPet.get(petId)!.push({
        feeding_time: row.feeding_time,
        amount_served_grams: Number(row.amount_served_grams), // ✨ NUEVO
        amount_eaten_grams: Number(row.amount_eaten_grams),
      });
    }

    // Convertir y calcular meal_balances para cada mascota
    const balances: TodayBalance[] = result.rows.map(
      (row: TodayBalanceRow & { num_meals?: number }) => {
        const petId = row.pet_id;
        const dailyGoal = Number(row.daily_goal);
        const schedules = schedulesByPet.get(petId) || [];
        const feedings = feedingsByPet.get(petId) || [];

        // ✨ Calcular meal_balances si tiene schedules
        let mealBalances: MealBalance[] | undefined;
        if (schedules.length > 0) {
          mealBalances = calculateMealBalances(dailyGoal, schedules, feedings);
        }

        return {
          pet_id: petId,
          pet_name: row.pet_name,
          achievement_pct: parseFloat(String(row.achievement_pct || "0")),
          total_served: Number(row.total_served),
          total_eaten: Number(row.total_eaten),
          total_leftover: Number(row.total_leftover),
          daily_goal: dailyGoal,
          status: row.status,
          meal_balances: mealBalances,
        };
      }
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
/**
 * 🎯 GESTIÓN DIARIA: Estadísticas de tendencia semanal
 *
 * Muestra últimos 7 días desde la fecha especificada hacia atrás.
 * FOCO: Contexto de la gestión diaria actual + tendencia reciente.
 * USO SECUNDARIO: Análisis de semanas pasadas específicas.
 *
 * ✨ FIXED: Filtrar días sin datos para evitar promedios distorsionados.
 * Muestra contexto: "87% (5/7 días con datos)" para interpretación correcta.
 *
 * @param endDate - Fecha final ISO (YYYY-MM-DD). Default: HOY (última semana)
 * @returns Stats agregados de los últimos 7 días desde endDate
 */
export async function getWeeklyStats(
  endDate?: string
): Promise<Result<WeeklyStats[]>> {
  try {
    // Validación de parámetros
    if (endDate) {
      const validation = DateSchema.safeParse(endDate);
      if (!validation.success) {
        return fail(validation.error.errors[0]?.message || "Fecha inválida");
      }
    }

    const { householdId } = await requireHousehold();
    // DEFAULT: Hoy (contexto de gestión diaria)
    const targetEndDate = endDate || new Date().toISOString().split("T")[0];

    const result = await query(
      `
      SELECT 
        dfs.feeding_date as date,
        SUM(dfs.total_eaten_grams) as total_eaten,
        -- ✨ FIXED: Solo promediar días con datos reales
        ROUND(AVG(dfs.goal_achievement_pct) FILTER (WHERE dfs.total_eaten_grams > 0), 2) as avg_achievement_pct,
        COUNT(*) FILTER (WHERE dfs.met_target = true) as days_on_track,
        -- ✨ NUEVO: Contar días con datos vs total de días
        COUNT(*) FILTER (WHERE dfs.total_eaten_grams > 0) as days_with_data,
        7 as total_days
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

    // ✨ Convertir tipos numéricos correctamente
    const stats: WeeklyStats[] = result.rows.map((row) => ({
      date: row.date,
      total_eaten: Number(row.total_eaten || 0),
      avg_achievement_pct: parseFloat(String(row.avg_achievement_pct || "0")),
      days_on_track: Number(row.days_on_track || 0),
      days_with_data: Number(row.days_with_data || 0),
      total_days: 7,
    }));

    return ok(stats);
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
export async function getAlertsCount(date?: string): Promise<Result<number>> {
  try {
    // Validación de parámetros
    if (date) {
      const validation = DateSchema.safeParse(date);
      if (!validation.success) {
        return fail(validation.error.errors[0]?.message || "Fecha inválida");
      }
    }

    // Obtener balances con meal_balances
    const balancesResult = await getTodayBalance(date);
    if (!balancesResult.ok) {
      return fail(balancesResult.message);
    }

    const balances = balancesResult.data!;

    // ✨ Contar mascotas que realmente necesitan atención
    // Lógica inteligente:
    // - Si tiene tomas PENDING (futuras): NO contar
    // - Si tiene tomas DELAYED: SÍ contar
    // - Si todas completadas pero total insuficiente: SÍ contar
    let alertCount = 0;

    for (const balance of balances) {
      // Si no tiene meal_balances, usar lógica legacy
      if (!balance.meal_balances || balance.meal_balances.length === 0) {
        if (balance.status === "under") {
          alertCount++;
        }
        continue;
      }

      const meals = balance.meal_balances;
      const hasPending = meals.some((m) => m.status === "pending");
      const hasDelayed = meals.some((m) => m.status === "delayed");
      const allCompleted = meals.every((m) => m.status === "completed");

      // Contar si:
      // 1. Tiene tomas DELAYED → Alerta crítica
      // 2. Todas completadas pero total insuficiente → Alerta
      // NO contar si hay tomas PENDING (progreso normal esperado)
      if (hasDelayed) {
        alertCount++;
      } else if (!hasPending && allCompleted && balance.status === "under") {
        alertCount++;
      }
    }

    return ok(alertCount);
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
    // Validación de parámetros
    const petIdValidation = z.string().uuid().safeParse(petId);
    if (!petIdValidation.success) {
      return fail("ID de mascota inválido");
    }

    if (endDate) {
      const dateValidation = DateSchema.safeParse(endDate);
      if (!dateValidation.success) {
        return fail(
          dateValidation.error.errors[0]?.message || "Fecha inválida"
        );
      }
    }

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
    // Validación de parámetros
    if (date) {
      const validation = DateSchema.safeParse(date);
      if (!validation.success) {
        return fail(validation.error.errors[0]?.message || "Fecha inválida");
      }
    }

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

    // Promedio de cumplimiento del DÍA ANTERIOR (día completo, más útil que promedio semanal)
    // Solo si targetDate es HOY, calculamos ayer. Si es histórico, calculamos el día anterior a esa fecha.
    const yesterdayDate = new Date(targetDate);
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split("T")[0];

    const yesterdayResult = await query(
      `
      SELECT ROUND(AVG(goal_achievement_pct), 2) as avg
      FROM daily_feeding_summary dfs
      JOIN pets p ON p.id = dfs.pet_id
      WHERE p.household_id = $1
        AND p.is_active = true
        AND dfs.feeding_date = $2::date
      `,
      [householdId, yesterdayStr]
    );
    const yesterdayAchievementPct = Number(yesterdayResult.rows[0]?.avg || 0);

    const overview: HouseholdOverview = {
      total_pets: totalPets,
      pets_on_track_today: petsOnTrackToday,
      total_feedings_last_7_days: totalFeedingsLast7Days,
      yesterday_achievement_pct: yesterdayAchievementPct,
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
