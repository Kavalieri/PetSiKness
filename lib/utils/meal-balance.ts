/**
 * Meal Balance Calculation Utilities
 * Pet SiKness - Per-Meal Tracking System
 */

// ============================================
// Types
// ============================================

/**
 * Horario de toma simplificado (solo datos necesarios para cálculo)
 */
export interface SimpleMealSchedule {
  meal_number: number;
  scheduled_time: string;
  notes?: string;
}

/**
 * Estado de una toma individual
 */
export type MealStatus =
  | "completed" // ✅ Completado: comido >= esperado
  | "pending" // ⏰ Pendiente: aún no es la hora
  | "delayed" // 🔴 Retrasado: pasó la hora + margen y no cumplió
  | "partial"; // 🟡 Parcial: comió algo pero menos de lo esperado

/**
 * Balance de una toma específica
 */
export interface MealBalance {
  meal_number: number;
  scheduled_time: string; // Hora orientativa programada
  actual_time?: string; // ✨ NUEVO: Hora real del feeding (si completada)
  expected_grams: number;
  eaten_grams: number;
  status: MealStatus;
  percentage: number;
  is_due: boolean; // Si ya pasó la hora programada
  minutes_late?: number; // Minutos de retraso (si aplica)
  minutes_early?: number; // ✨ NUEVO: Minutos de adelanto (si aplica)
}

/**
 * Registro de feeding con timestamp
 */
export interface FeedingRecord {
  feeding_time: string; // HH:mm format
  amount_eaten_grams: number;
}

// ============================================
// Constants
// ============================================

/**
 * Ventana de tiempo (en minutos) para considerar un feeding
 * como parte de una toma específica
 */
const TIME_WINDOW_MINUTES = 60; // ±1 hora

/**
 * Margen de gracia (en minutos) después de la hora programada
 * antes de considerar una toma como "retrasada"
 */
const GRACE_PERIOD_MINUTES = 30;

/**
 * Umbral de cumplimiento (porcentaje)
 * Por encima de este % se considera "completado"
 */
const COMPLETION_THRESHOLD = 90;

// ============================================
// Time Utilities
// ============================================

/**
 * Convierte string HH:mm a minutos desde medianoche
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Obtiene la hora actual en formato HH:mm
 */
export function getCurrentTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

/**
 * Calcula diferencia en minutos entre dos horas
 */
function timeDifferenceMinutes(time1: string, time2: string): number {
  return Math.abs(timeToMinutes(time1) - timeToMinutes(time2));
}

/**
 * Verifica si currentTime >= scheduledTime (con margen opcional)
 */
function isTimeDue(
  scheduledTime: string,
  currentTime: string,
  marginMinutes = 0
): boolean {
  return (
    timeToMinutes(currentTime) >= timeToMinutes(scheduledTime) + marginMinutes
  );
}

// ============================================
// Core Balance Calculation
// ============================================

/**
 * Calcula el balance de todas las tomas del día para una mascota
 *
 * @param dailyGoalGrams - Meta diaria total de comida (en gramos)
 * @param mealSchedules - Horarios programados de las tomas
 * @param feedings - Registros de alimentación del día
 * @param currentTime - Hora actual (formato HH:mm), opcional (usa hora del sistema)
 * @returns Array con el balance de cada toma
 */
export function calculateMealBalances(
  dailyGoalGrams: number,
  mealSchedules: SimpleMealSchedule[],
  feedings: FeedingRecord[],
  currentTime?: string
): MealBalance[] {
  const now = currentTime || getCurrentTime();
  const numMeals = mealSchedules.length;

  if (numMeals === 0) {
    return [];
  }

  // Calcular porción esperada por toma
  const expectedPerMeal = Math.round(dailyGoalGrams / numMeals);

  // Ordenar schedules por meal_number (debería estar ordenado pero por si acaso)
  const sortedSchedules = [...mealSchedules].sort(
    (a, b) => a.meal_number - b.meal_number
  );

  // Calcular balance para cada toma
  return sortedSchedules.map((schedule) => {
    // Encontrar feedings dentro de la ventana de tiempo de esta toma
    const mealFeedings = feedings.filter((feeding) => {
      const diff = timeDifferenceMinutes(
        feeding.feeding_time,
        schedule.scheduled_time
      );
      return diff <= TIME_WINDOW_MINUTES;
    });

    // Sumar cantidad comida en esta toma
    const eatenGrams = mealFeedings.reduce(
      (sum, f) => sum + f.amount_eaten_grams,
      0
    );

    // ✨ NUEVO: Determinar hora real de la toma (si hubo feedings)
    let actualTime: string | undefined;
    if (mealFeedings.length > 0) {
      // Usar la hora del primer feeding (asumiendo que están ordenados)
      actualTime = mealFeedings[0].feeding_time;
    }

    // Calcular porcentaje de cumplimiento
    const percentage =
      expectedPerMeal > 0
        ? Math.round((eatenGrams / expectedPerMeal) * 100)
        : 0;

    // Verificar si ya pasó la hora
    const isDue = isTimeDue(schedule.scheduled_time, now);

    // Calcular minutos de diferencia con hora programada
    let minutesLate: number | undefined;
    let minutesEarly: number | undefined;

    if (actualTime) {
      const scheduledMinutes = timeToMinutes(schedule.scheduled_time);
      const actualMinutes = timeToMinutes(actualTime);
      const diff = actualMinutes - scheduledMinutes;

      if (diff > 0) {
        minutesLate = diff;
      } else if (diff < 0) {
        minutesEarly = Math.abs(diff);
      }
    } else if (isDue) {
      // Si no hay feeding pero ya pasó la hora, calcular retraso
      minutesLate = timeToMinutes(now) - timeToMinutes(schedule.scheduled_time);
    }

    // Determinar status
    let status: MealStatus;

    if (!isDue) {
      // Aún no es la hora → PENDING
      status = "pending";
    } else if (percentage >= COMPLETION_THRESHOLD) {
      // Ya comió suficiente → COMPLETED
      status = "completed";
    } else if (
      eatenGrams === 0 &&
      isTimeDue(schedule.scheduled_time, now, GRACE_PERIOD_MINUTES)
    ) {
      // No ha comido nada y ya pasó el período de gracia → DELAYED
      status = "delayed";
    } else if (eatenGrams > 0 && eatenGrams < expectedPerMeal) {
      // Comió algo pero no suficiente → PARTIAL
      status = "partial";
    } else if (eatenGrams === 0) {
      // No ha comido pero aún está en período de gracia → PENDING
      status = "pending";
    } else {
      // Default: COMPLETED
      status = "completed";
    }

    return {
      meal_number: schedule.meal_number,
      scheduled_time: schedule.scheduled_time,
      actual_time: actualTime, // ✨ NUEVO: Hora real
      expected_grams: expectedPerMeal,
      eaten_grams: eatenGrams,
      status,
      percentage,
      is_due: isDue,
      minutes_late: minutesLate,
      minutes_early: minutesEarly, // ✨ NUEVO
    };
  });
}

// ============================================
// Summary Functions
// ============================================

/**
 * Calcula resumen agregado del día
 */
export interface DailySummary {
  total_meals: number;
  completed_meals: number;
  pending_meals: number;
  delayed_meals: number;
  partial_meals: number;
  total_expected_grams: number;
  total_eaten_grams: number;
  overall_percentage: number;
  all_completed: boolean;
  has_delays: boolean;
}

/**
 * Genera resumen agregado desde los balances individuales
 */
export function calculateDailySummary(balances: MealBalance[]): DailySummary {
  const totalMeals = balances.length;
  const completedMeals = balances.filter(
    (b) => b.status === "completed"
  ).length;
  const pendingMeals = balances.filter((b) => b.status === "pending").length;
  const delayedMeals = balances.filter((b) => b.status === "delayed").length;
  const partialMeals = balances.filter((b) => b.status === "partial").length;

  const totalExpected = balances.reduce((sum, b) => sum + b.expected_grams, 0);
  const totalEaten = balances.reduce((sum, b) => sum + b.eaten_grams, 0);

  const overallPercentage =
    totalExpected > 0 ? Math.round((totalEaten / totalExpected) * 100) : 0;

  return {
    total_meals: totalMeals,
    completed_meals: completedMeals,
    pending_meals: pendingMeals,
    delayed_meals: delayedMeals,
    partial_meals: partialMeals,
    total_expected_grams: totalExpected,
    total_eaten_grams: totalEaten,
    overall_percentage: overallPercentage,
    all_completed: completedMeals === totalMeals,
    has_delays: delayedMeals > 0,
  };
}

// ============================================
// UI Helper Functions
// ============================================

/**
 * Obtiene emoji/icono para el status
 */
export function getStatusIcon(status: MealStatus): string {
  const icons: Record<MealStatus, string> = {
    completed: "✅",
    pending: "⏰",
    delayed: "🔴",
    partial: "🟡",
  };
  return icons[status];
}

/**
 * Obtiene texto legible para el status
 */
export function getStatusLabel(status: MealStatus): string {
  const labels: Record<MealStatus, string> = {
    completed: "Completado",
    pending: "Pendiente",
    delayed: "Retrasado",
    partial: "Parcial",
  };
  return labels[status];
}

/**
 * Obtiene color de badge para el status
 */
export function getStatusColor(status: MealStatus): string {
  const colors: Record<MealStatus, string> = {
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    pending: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    delayed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    partial:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  };
  return colors[status];
}

/**
 * Formatea cantidad comida vs esperada
 */
export function formatMealProgress(
  eatenGrams: number,
  expectedGrams: number
): string {
  return `${eatenGrams}g / ${expectedGrams}g`;
}

/**
 * Formatea minutos de retraso en texto legible
 */
export function formatDelay(minutesLate: number): string {
  if (minutesLate < 60) {
    return `${minutesLate} min`;
  }
  const hours = Math.floor(minutesLate / 60);
  const mins = minutesLate % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}
