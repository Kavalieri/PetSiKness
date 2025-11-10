/**
 * Zod Schema for Food Validation
 * Pet SiKness - Food Management
 */

import { z } from "zod";
import { FOOD_CONSTRAINTS } from "@/lib/constants/foods";

// ============================================
// Enum Values for Zod (tuples, not readonly)
// ============================================

const FOOD_TYPES = ["dry", "wet", "raw", "homemade", "treats"] as const;
const QUALITY_LEVELS = ["poor", "fair", "good", "excellent"] as const;
const SPECIES_TYPES = ["cat", "dog", "bird", "rabbit", "other"] as const;
const AGE_RANGES = [
  "kitten",
  "puppy",
  "adult",
  "senior",
  "all",
  "other",
] as const;

// ============================================
// Food Form Schema (Base)
// ============================================

const FoodFormSchemaBase = z.object({
  // ========================================
  // Identificación (Required)
  // ========================================
  name: z
    .string()
    .min(FOOD_CONSTRAINTS.name.minLength, "El nombre es obligatorio")
    .max(
      FOOD_CONSTRAINTS.name.maxLength,
      `Máximo ${FOOD_CONSTRAINTS.name.maxLength} caracteres`
    )
    .trim(),

  brand: z
    .string()
    .max(
      FOOD_CONSTRAINTS.brand.maxLength,
      `Máximo ${FOOD_CONSTRAINTS.brand.maxLength} caracteres`
    )
    .trim()
    .optional(),

  food_type: z.enum(FOOD_TYPES, {
    errorMap: () => ({
      message: "Selecciona un tipo de alimento válido",
    }),
  }),

  // ========================================
  // Información Nutricional (Optional)
  // ========================================
  calories_per_100g: z
    .number({
      invalid_type_error: "Las calorías deben ser un número",
    })
    .int("Las calorías deben ser un número entero")
    .min(
      FOOD_CONSTRAINTS.calories.min,
      `Mínimo ${FOOD_CONSTRAINTS.calories.min} kcal`
    )
    .max(
      FOOD_CONSTRAINTS.calories.max,
      `Máximo ${FOOD_CONSTRAINTS.calories.max} kcal`
    )
    .optional(),

  protein_percentage: z
    .number({
      invalid_type_error: "La proteína debe ser un número",
    })
    .min(
      FOOD_CONSTRAINTS.percentage.min,
      `Mínimo ${FOOD_CONSTRAINTS.percentage.min}%`
    )
    .max(
      FOOD_CONSTRAINTS.percentage.max,
      `Máximo ${FOOD_CONSTRAINTS.percentage.max}%`
    )
    .optional()
    ,

  fat_percentage: z
    .number({
      invalid_type_error: "La grasa debe ser un número",
    })
    .min(
      FOOD_CONSTRAINTS.percentage.min,
      `Mínimo ${FOOD_CONSTRAINTS.percentage.min}%`
    )
    .max(
      FOOD_CONSTRAINTS.percentage.max,
      `Máximo ${FOOD_CONSTRAINTS.percentage.max}%`
    )
    .optional()
    ,

  carbs_percentage: z
    .number({
      invalid_type_error: "Los carbohidratos deben ser un número",
    })
    .min(
      FOOD_CONSTRAINTS.percentage.min,
      `Mínimo ${FOOD_CONSTRAINTS.percentage.min}%`
    )
    .max(
      FOOD_CONSTRAINTS.percentage.max,
      `Máximo ${FOOD_CONSTRAINTS.percentage.max}%`
    )
    .optional()
    ,

  fiber_percentage: z
    .number({
      invalid_type_error: "La fibra debe ser un número",
    })
    .min(
      FOOD_CONSTRAINTS.percentage.min,
      `Mínimo ${FOOD_CONSTRAINTS.percentage.min}%`
    )
    .max(
      FOOD_CONSTRAINTS.percentage.max,
      `Máximo ${FOOD_CONSTRAINTS.percentage.max}%`
    )
    .optional()
    ,

  moisture_percentage: z
    .number({
      invalid_type_error: "La humedad debe ser un número",
    })
    .min(
      FOOD_CONSTRAINTS.percentage.min,
      `Mínimo ${FOOD_CONSTRAINTS.percentage.min}%`
    )
    .max(
      FOOD_CONSTRAINTS.percentage.max,
      `Máximo ${FOOD_CONSTRAINTS.percentage.max}%`
    )
    .optional()
    ,

  // ========================================
  // Producto (Optional)
  // ========================================
  ingredients: z
    .string()
    .max(2000, "Máximo 2000 caracteres")
    .trim()
    .optional()
    ,

  serving_size_grams: z
    .number({
      invalid_type_error: "El tamaño de porción debe ser un número",
    })
    .int("El tamaño de porción debe ser un número entero")
    .min(FOOD_CONSTRAINTS.weight.min, `Mínimo ${FOOD_CONSTRAINTS.weight.min}g`)
    .max(FOOD_CONSTRAINTS.weight.max, `Máximo ${FOOD_CONSTRAINTS.weight.max}g`)
    .optional()
    ,

  package_size_grams: z
    .number({
      invalid_type_error: "El tamaño del paquete debe ser un número",
    })
    .int("El tamaño del paquete debe ser un número entero")
    .min(FOOD_CONSTRAINTS.weight.min, `Mínimo ${FOOD_CONSTRAINTS.weight.min}g`)
    .max(FOOD_CONSTRAINTS.weight.max, `Máximo ${FOOD_CONSTRAINTS.weight.max}g`)
    .optional()
    ,

  price_per_package: z
    .number({
      invalid_type_error: "El precio debe ser un número",
    })
    .min(FOOD_CONSTRAINTS.price.min, `Mínimo ${FOOD_CONSTRAINTS.price.min}€`)
    .max(FOOD_CONSTRAINTS.price.max, `Máximo ${FOOD_CONSTRAINTS.price.max}€`)
    .optional()
    ,

  // ========================================
  // Calidad (Optional)
  // ========================================
  palatability: z
    .enum(QUALITY_LEVELS, {
      errorMap: () => ({
        message: "Selecciona un nivel de palatabilidad válido",
      }),
    })
    .optional()
    ,

  digestibility: z
    .enum(QUALITY_LEVELS, {
      errorMap: () => ({
        message: "Selecciona un nivel de digestibilidad válido",
      }),
    })
    .optional()
    ,

  // ========================================
  // Restricciones (Optional)
  // ========================================
  suitable_for_species: z
    .array(z.enum(SPECIES_TYPES))
    .optional()
    .default([]),

  age_range: z
    .enum(AGE_RANGES, {
      errorMap: () => ({
        message: "Selecciona un rango de edad válido",
      }),
    })
    .optional(),
});

// ============================================
// Food Form Schema (with validation)
// ============================================

export const FoodFormSchema = FoodFormSchemaBase
  // ========================================
  // Custom Validation: Macros Sum ≤ 100%
  // ========================================
  .refine(
    (data) => {
      const protein = data.protein_percentage || 0;
      const fat = data.fat_percentage || 0;
      const carbs = data.carbs_percentage || 0;
      const sum = protein + fat + carbs;
      return sum <= FOOD_CONSTRAINTS.macrosSum.max;
    },
    {
      message: `La suma de proteína + grasa + carbohidratos no puede superar ${FOOD_CONSTRAINTS.macrosSum.max}%`,
      path: ["protein_percentage"], // Show error on first macro field
    }
  );

// ============================================
// Type Inference
// ============================================

export type FoodFormInput = z.infer<typeof FoodFormSchema>;

// ============================================
// Partial Schema (for Updates)
// ============================================

/**
 * Partial schema for updates (all fields optional except constraints)
 */
export const FoodUpdateSchema = FoodFormSchemaBase.partial().refine(
  (data) => {
    // Only validate macros if at least one is provided
    const hasAnyMacro =
      data.protein_percentage !== undefined ||
      data.fat_percentage !== undefined ||
      data.carbs_percentage !== undefined;

    if (!hasAnyMacro) return true;

    const protein = data.protein_percentage || 0;
    const fat = data.fat_percentage || 0;
    const carbs = data.carbs_percentage || 0;
    const sum = protein + fat + carbs;
    return sum <= FOOD_CONSTRAINTS.macrosSum.max;
  },
  {
    message: `La suma de proteína + grasa + carbohidratos no puede superar ${FOOD_CONSTRAINTS.macrosSum.max}%`,
    path: ["protein_percentage"],
  }
);

export type FoodUpdateInput = z.infer<typeof FoodUpdateSchema>;

// ============================================
// Filter Schema
// ============================================

export const FoodFilterSchema = z.object({
  search: z.string().optional(),
  food_type: z.enum(FOOD_TYPES).optional(),
  species: z.enum(SPECIES_TYPES).optional(),
  age_range: z.enum(AGE_RANGES).optional(),
  is_active: z.boolean().optional(),
  min_protein: z.number().min(0).max(100).optional(),
  max_price: z.number().min(0).optional(),
});

export type FoodFilterInput = z.infer<typeof FoodFilterSchema>;
