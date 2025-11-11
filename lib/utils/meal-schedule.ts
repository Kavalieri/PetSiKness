/**
 * Meal Schedule Utilities
 * Pet SiKness - Meal Scheduling System
 */

import type { MealScheduleFormData } from "@/types/pets";

// ============================================
// Default Schedule Generation
// ============================================

/**
 * Genera horarios por defecto basados en el número de comidas diarias
 * 
 * Distribución predeterminada:
 * - 1 toma: 12:00 (mediodía)
 * - 2 tomas: 08:00, 20:00 (mañana y noche)
 * - 3 tomas: 08:00, 14:00, 20:00 (mañana, tarde, noche)
 * - 4 tomas: 07:00, 12:00, 17:00, 21:00 (cada 5 horas aprox)
 * - 5+ tomas: distribuidas uniformemente entre 07:00 y 19:00
 * 
 * @param numMeals - Número de comidas diarias
 * @returns Array de horarios con meal_number y scheduled_time
 */
export function generateDefaultSchedule(
  numMeals: number
): MealScheduleFormData[] {
  // Validación básica
  if (numMeals < 1) {
    throw new Error("El número de comidas debe ser al menos 1");
  }
  if (numMeals > 10) {
    throw new Error("El número de comidas no puede ser mayor a 10");
  }

  // Horarios predefinidos para casos comunes
  const predefinedSchedules: Record<number, string[]> = {
    1: ["12:00"],
    2: ["08:00", "20:00"],
    3: ["08:00", "14:00", "20:00"],
    4: ["07:00", "12:00", "17:00", "21:00"],
  };

  // Si existe horario predefinido, usarlo
  if (predefinedSchedules[numMeals]) {
    return predefinedSchedules[numMeals].map((time, index) => ({
      meal_number: index + 1,
      scheduled_time: time,
    }));
  }

  // Para 5+ comidas, distribuir uniformemente entre 07:00 y 19:00
  // Total de minutos: 12 horas = 720 minutos
  const startHour = 7; // 07:00
  const endHour = 19; // 19:00
  const totalMinutes = (endHour - startHour) * 60;
  const intervalMinutes = totalMinutes / (numMeals - 1);

  const schedules: MealScheduleFormData[] = [];

  for (let i = 0; i < numMeals; i++) {
    const minutesFromStart = Math.round(i * intervalMinutes);
    const hour = startHour + Math.floor(minutesFromStart / 60);
    const minute = minutesFromStart % 60;

    const scheduled_time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;

    schedules.push({
      meal_number: i + 1,
      scheduled_time,
    });
  }

  return schedules;
}

// ============================================
// Schedule Validation Helpers
// ============================================

/**
 * Valida que un horario esté en formato HH:mm válido
 * 
 * @param time - Hora en formato string
 * @returns true si es válida, false si no
 */
export function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(time);
}

/**
 * Compara dos horarios para ordenamiento cronológico
 * 
 * @param timeA - Primera hora (HH:mm)
 * @param timeB - Segunda hora (HH:mm)
 * @returns Número negativo si A es antes que B, positivo si A es después, 0 si iguales
 */
export function compareScheduleTimes(timeA: string, timeB: string): number {
  const [hourA, minuteA] = timeA.split(":").map(Number);
  const [hourB, minuteB] = timeB.split(":").map(Number);

  if (hourA !== hourB) {
    return hourA - hourB;
  }
  return minuteA - minuteB;
}

/**
 * Verifica si un array de horarios está en orden cronológico
 * 
 * @param schedules - Array de horarios
 * @returns true si están en orden, false si no
 */
export function areSchedulesInOrder(
  schedules: MealScheduleFormData[]
): boolean {
  if (schedules.length <= 1) return true;

  for (let i = 1; i < schedules.length; i++) {
    if (
      compareScheduleTimes(
        schedules[i - 1].scheduled_time,
        schedules[i].scheduled_time
      ) >= 0
    ) {
      return false;
    }
  }

  return true;
}

/**
 * Verifica si hay horarios duplicados
 * 
 * @param schedules - Array de horarios
 * @returns true si hay duplicados, false si no
 */
export function hasDuplicateSchedules(
  schedules: MealScheduleFormData[]
): boolean {
  const times = schedules.map((s) => s.scheduled_time);
  const uniqueTimes = new Set(times);
  return uniqueTimes.size !== times.length;
}

// ============================================
// Schedule Formatting
// ============================================

/**
 * Formatea un horario para mostrar en UI
 * 
 * @param time - Hora en formato HH:mm
 * @returns String formateado (ej: "08:00 AM", "14:00 PM")
 */
export function formatScheduleTime(time: string): string {
  if (!isValidTimeFormat(time)) return time;

  const [hour, minute] = time.split(":").map(Number);
  const period = hour < 12 ? "AM" : "PM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
}

/**
 * Convierte un horario de 12h a 24h
 * 
 * @param time - Hora en formato "8:00 AM" o "2:30 PM"
 * @returns Hora en formato "08:00" o "14:30"
 */
export function convertTo24Hour(time: string): string {
  const match = time.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time;

  const [, hourStr, minute, period] = match;
  let hour = parseInt(hourStr, 10);

  if (period.toUpperCase() === "PM" && hour !== 12) {
    hour += 12;
  } else if (period.toUpperCase() === "AM" && hour === 12) {
    hour = 0;
  }

  return `${hour.toString().padStart(2, "0")}:${minute}`;
}

/**
 * Obtiene el nombre descriptivo de una toma
 * 
 * @param mealNumber - Número de la toma (1, 2, 3...)
 * @returns Nombre descriptivo ("Primera toma", "Segunda toma", etc.)
 */
export function getMealName(mealNumber: number): string {
  const names: Record<number, string> = {
    1: "Primera toma",
    2: "Segunda toma",
    3: "Tercera toma",
    4: "Cuarta toma",
    5: "Quinta toma",
  };

  return names[mealNumber] || `Toma ${mealNumber}`;
}
