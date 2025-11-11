/**
 * Zod Schema for Meal Schedule Validation
 * Pet SiKness - Meal Scheduling System
 */

import { z } from "zod";

// ============================================
// Constants
// ============================================

/**
 * Formato de hora válido: HH:mm (24h)
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Límites de meal_number
 */
export const MEAL_SCHEDULE_CONSTRAINTS = {
  meal_number: {
    min: 1,
    max: 10, // Máximo realista de tomas por día
  },
} as const;

// ============================================
// Meal Schedule Schema (Single)
// ============================================

/**
 * Schema para una toma individual
 */
export const MealScheduleSchema = z.object({
  meal_number: z
    .number({
      required_error: "El número de toma es obligatorio",
      invalid_type_error: "El número de toma debe ser un número",
    })
    .int("El número de toma debe ser un número entero")
    .min(
      MEAL_SCHEDULE_CONSTRAINTS.meal_number.min,
      `El número de toma debe ser al menos ${MEAL_SCHEDULE_CONSTRAINTS.meal_number.min}`
    )
    .max(
      MEAL_SCHEDULE_CONSTRAINTS.meal_number.max,
      `El número de toma no puede ser mayor a ${MEAL_SCHEDULE_CONSTRAINTS.meal_number.max}`
    ),

  scheduled_time: z
    .string({
      required_error: "La hora programada es obligatoria",
    })
    .regex(
      TIME_FORMAT_REGEX,
      "El formato de hora debe ser HH:mm (ej: 08:00, 14:30)"
    ),

  notes: z.string().max(500, "Las notas no pueden exceder 500 caracteres").optional(),
});

// ============================================
// Meal Schedules Array Schema
// ============================================

/**
 * Schema para el array completo de tomas de una mascota
 * Validaciones adicionales:
 * 1. Las horas deben estar en orden cronológico
 * 2. No puede haber horas duplicadas
 * 3. meal_number debe ser secuencial (1, 2, 3...)
 */
export const MealSchedulesArraySchema = z
  .array(MealScheduleSchema)
  .min(1, "Debe haber al menos una toma programada")
  .max(
    MEAL_SCHEDULE_CONSTRAINTS.meal_number.max,
    `No puede haber más de ${MEAL_SCHEDULE_CONSTRAINTS.meal_number.max} tomas`
  )
  .refine(
    (schedules) => {
      // Validar que meal_number sea secuencial (1, 2, 3...)
      const sortedByMealNumber = [...schedules].sort(
        (a, b) => a.meal_number - b.meal_number
      );
      return sortedByMealNumber.every(
        (schedule, index) => schedule.meal_number === index + 1
      );
    },
    {
      message:
        "Los números de toma deben ser secuenciales (1, 2, 3...) sin saltos",
    }
  )
  .refine(
    (schedules) => {
      // Validar que las horas estén en orden cronológico
      const times = schedules.map((s) => s.scheduled_time);
      const sortedTimes = [...times].sort();
      return times.every((time, index) => time === sortedTimes[index]);
    },
    {
      message:
        "Las horas programadas deben estar en orden cronológico (ej: 08:00 antes que 14:00)",
    }
  )
  .refine(
    (schedules) => {
      // Validar que no haya horas duplicadas
      const times = schedules.map((s) => s.scheduled_time);
      const uniqueTimes = new Set(times);
      return uniqueTimes.size === times.length;
    },
    {
      message: "No puede haber dos tomas programadas a la misma hora",
    }
  );

// ============================================
// Pet with Meal Schedules Schema
// ============================================

/**
 * Schema para validar que meal_schedules coincida con daily_meals_target
 */
export const PetWithMealSchedulesSchema = z
  .object({
    daily_meals_target: z.number().int().positive(),
    meal_schedules: MealSchedulesArraySchema,
  })
  .refine(
    (data) => {
      // Validar que la longitud del array coincida con daily_meals_target
      return data.meal_schedules.length === data.daily_meals_target;
    },
    {
      message:
        "El número de horarios programados debe coincidir con el número de tomas diarias",
    }
  );

// ============================================
// Type Exports
// ============================================

/**
 * Type inferido del schema de una toma
 */
export type MealScheduleInput = z.infer<typeof MealScheduleSchema>;

/**
 * Type inferido del array de tomas
 */
export type MealSchedulesArrayInput = z.infer<typeof MealSchedulesArraySchema>;

/**
 * Type para pet con meal schedules
 */
export type PetWithMealSchedulesInput = z.infer<
  typeof PetWithMealSchedulesSchema
>;
