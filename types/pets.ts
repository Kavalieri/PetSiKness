import { z } from "zod";
import type { Pets } from "./database.generated";

// ============================================
// ENUMS Y TIPOS AUXILIARES
// ============================================

/**
 * Especies de mascotas soportadas
 */
export const SPECIES = {
  CAT: "cat",
  DOG: "dog",
  BIRD: "bird",
  RABBIT: "rabbit",
  HAMSTER: "hamster",
  GUINEA_PIG: "guinea_pig",
  FERRET: "ferret",
  OTHER: "other",
} as const;

export type Species = (typeof SPECIES)[keyof typeof SPECIES];

/**
 * Género de la mascota
 */
export const GENDER = {
  MALE: "male",
  FEMALE: "female",
  UNKNOWN: "unknown",
} as const;

export type Gender = (typeof GENDER)[keyof typeof GENDER];

/**
 * Condición corporal
 */
export const BODY_CONDITION = {
  UNDERWEIGHT: "underweight",
  IDEAL: "ideal",
  OVERWEIGHT: "overweight",
  OBESE: "obese",
} as const;

export type BodyCondition =
  (typeof BODY_CONDITION)[keyof typeof BODY_CONDITION];

/**
 * Nivel de apetito
 */
export const APPETITE = {
  POOR: "poor",
  NORMAL: "normal",
  GOOD: "good",
  EXCELLENT: "excellent",
} as const;

export type Appetite = (typeof APPETITE)[keyof typeof APPETITE];

/**
 * Nivel de actividad física
 */
export const ACTIVITY_LEVEL = {
  SEDENTARY: "sedentary",
  LOW: "low",
  MODERATE: "moderate",
  HIGH: "high",
  VERY_HIGH: "very_high",
} as const;

export type ActivityLevel =
  (typeof ACTIVITY_LEVEL)[keyof typeof ACTIVITY_LEVEL];

// ============================================
// TIPOS DE DATOS
// ============================================

/**
 * Pet type extendido del schema de BD con tipos más específicos
 */
export type Pet = Pets;

/**
 * Datos para crear una mascota (sin ID, timestamps, household_id)
 */
export type PetCreateInput = Omit<
  Pet,
  "id" | "household_id" | "created_at" | "updated_at"
>;

/**
 * Datos para actualizar una mascota (todos opcionales excepto los requeridos)
 */
export type PetUpdateInput = Partial<PetCreateInput>;

/**
 * Datos básicos de mascota para listados
 */
export type PetSummary = Pick<
  Pet,
  | "id"
  | "name"
  | "species"
  | "breed"
  | "birth_date"
  | "weight_kg"
  | "body_condition"
  | "daily_food_goal_grams"
>;

// ============================================
// VALIDACIÓN ZOD
// ============================================

/**
 * Schema base para validación de texto
 */
const requiredString = z.string().min(1, "Este campo es requerido");
const optionalString = z.string().optional().nullable();

/**
 * Schema de validación para formulario de mascota
 */
export const PetFormSchema = z.object({
  // Identificación básica
  name: requiredString.max(100, "Nombre demasiado largo (máx. 100 caracteres)"),
  species: z.enum(
    [
      SPECIES.CAT,
      SPECIES.DOG,
      SPECIES.BIRD,
      SPECIES.RABBIT,
      SPECIES.HAMSTER,
      SPECIES.GUINEA_PIG,
      SPECIES.FERRET,
      SPECIES.OTHER,
    ],
    { required_error: "Selecciona una especie" }
  ),
  breed: optionalString,

  // Información física
  birth_date: z
    .string()
    .optional()
    .nullable()
    .refine(
      (val) => {
        if (!val) return true; // Opcional
        const date = new Date(val);
        const now = new Date();
        return date <= now; // No puede ser futura
      },
      { message: "La fecha de nacimiento no puede ser futura" }
    ),
  gender: z
    .enum([GENDER.MALE, GENDER.FEMALE, GENDER.UNKNOWN], {
      required_error: "Selecciona un género",
    })
    .default(GENDER.UNKNOWN),
  weight_kg: z
    .number({
      required_error: "El peso es requerido",
      invalid_type_error: "El peso debe ser un número",
    })
    .positive("El peso debe ser mayor a 0")
    .max(200, "Peso demasiado alto (máx. 200kg)")
    .optional()
    .nullable(),
  body_condition: z
    .enum([
      BODY_CONDITION.UNDERWEIGHT,
      BODY_CONDITION.IDEAL,
      BODY_CONDITION.OVERWEIGHT,
      BODY_CONDITION.OBESE,
    ])
    .optional()
    .nullable(),

  // Objetivos nutricionales
  daily_food_goal_grams: z
    .number({
      required_error: "La meta diaria es requerida",
      invalid_type_error: "La meta debe ser un número",
    })
    .int("La meta debe ser un número entero")
    .positive("La meta debe ser mayor a 0")
    .max(5000, "Meta demasiado alta (máx. 5000g)"),
  daily_meals_target: z
    .number({
      invalid_type_error: "El número de comidas debe ser un número",
    })
    .int("El número de comidas debe ser entero")
    .positive("Debe ser al menos 1 comida")
    .max(10, "Máximo 10 comidas al día")
    .default(2),

  // Salud
  health_notes: optionalString,
  allergies: z.array(z.string()).optional().nullable().default([]),
  medications: z.array(z.string()).optional().nullable().default([]),

  // Comportamiento
  appetite: z
    .enum([APPETITE.POOR, APPETITE.NORMAL, APPETITE.GOOD, APPETITE.EXCELLENT])
    .optional()
    .nullable()
    .default(APPETITE.NORMAL),
  activity_level: z
    .enum([
      ACTIVITY_LEVEL.SEDENTARY,
      ACTIVITY_LEVEL.LOW,
      ACTIVITY_LEVEL.MODERATE,
      ACTIVITY_LEVEL.HIGH,
      ACTIVITY_LEVEL.VERY_HIGH,
    ])
    .optional()
    .nullable()
    .default(ACTIVITY_LEVEL.MODERATE),

  // Avatar
  photo_url: optionalString,
});

/**
 * Tipo inferido del schema de validación
 */
export type PetFormData = z.infer<typeof PetFormSchema>;

/**
 * Schema para validar solo el ID
 */
export const PetIdSchema = z.string().uuid("ID de mascota inválido");
