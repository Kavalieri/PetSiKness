/**
 * Types for Foods Domain
 * Pet SiKness - Food Management
 */

import type { Foods } from "./database.generated";

// ============================================
// Form Data Types
// ============================================

/**
 * Food form data structure
 * Used in create/edit forms
 */
export interface FoodFormData {
  // Identificación
  name: string;
  brand?: string;
  food_type: FoodType;

  // Información nutricional (por 100g)
  calories_per_100g?: number;
  protein_percentage?: number;
  fat_percentage?: number;
  carbs_percentage?: number;
  fiber_percentage?: number;
  moisture_percentage?: number;

  // Producto
  ingredients?: string;
  serving_size_grams?: number;
  package_size_grams?: number;
  price_per_package?: number;

  // Calidad
  palatability?: PalatabilityLevel;
  digestibility?: DigestibilityLevel;

  // Restricciones
  suitable_for_species?: SpeciesType[];
  age_range?: AgeRange;

  // Adicionales
  notes?: string;
  photo_url?: string;
  purchase_url?: string;
}

// ============================================
// Enums and Literals
// ============================================

/**
 * Food types available
 */
export type FoodType =
  | "dry"
  | "wet"
  | "raw"
  | "homemade"
  | "treat"
  | "supplement";

export const FOOD_TYPES: readonly FoodType[] = [
  "dry",
  "wet",
  "raw",
  "homemade",
  "treat",
  "supplement",
] as const;

/**
 * Palatability levels (preference/taste)
 */
export type PalatabilityLevel = "low" | "medium" | "high";

export const PALATABILITY_LEVELS: readonly PalatabilityLevel[] = [
  "low",
  "medium",
  "high",
] as const;

/**
 * Digestibility levels (digestion quality)
 */
export type DigestibilityLevel = "poor" | "fair" | "good" | "excellent";

export const DIGESTIBILITY_LEVELS: readonly DigestibilityLevel[] = [
  "poor",
  "fair",
  "good",
  "excellent",
] as const;

/**
 * Species types
 */
export type SpeciesType = "cat" | "dog" | "bird" | "rabbit" | "other";

export const SPECIES_TYPES: readonly SpeciesType[] = [
  "cat",
  "dog",
  "bird",
  "rabbit",
  "other",
] as const;

/**
 * Age ranges
 */
export type AgeRange = "kitten/puppy" | "adult" | "senior" | "all_ages";

export const AGE_RANGES: readonly AgeRange[] = [
  "kitten/puppy",
  "adult",
  "senior",
  "all_ages",
] as const;

// ============================================
// Display Types
// ============================================

/**
 * Food with nutritional calculations
 */
export interface FoodWithNutrition extends Foods {
  // Calculated fields
  totalMacros: number; // Sum of protein + fat + carbs
  caloriesPerGram?: number; // calories_per_100g / 100
  proteinGramsPerServing?: number;
  fatGramsPerServing?: number;
  carbsGramsPerServing?: number;
}

/**
 * Food list item (simplified for cards)
 */
export interface FoodListItem {
  id: string;
  name: string;
  brand?: string;
  food_type: string;
  calories_per_100g?: number;
  protein_percentage?: number;
  suitable_for_species?: string[];
  is_active: boolean;
  created_at: Date;
}

// ============================================
// Filter Types
// ============================================

/**
 * Food filters for search
 */
export interface FoodFilters {
  search?: string; // Search in name, brand
  food_type?: FoodType;
  species?: SpeciesType;
  age_range?: AgeRange;
  is_active?: boolean;
  min_protein?: number;
  max_price?: number;
}

/**
 * Sort options for food list
 */
export type FoodSortField =
  | "name"
  | "brand"
  | "calories_per_100g"
  | "protein_percentage"
  | "price_per_package"
  | "created_at";

export type FoodSortOrder = "asc" | "desc";

export interface FoodSort {
  field: FoodSortField;
  order: FoodSortOrder;
}

// ============================================
// Validation Helpers
// ============================================

/**
 * Check if food type is valid
 */
export function isValidFoodType(value: string): value is FoodType {
  return FOOD_TYPES.includes(value as FoodType);
}

/**
 * Check if palatability level is valid
 */
export function isValidPalatabilityLevel(
  value: string
): value is PalatabilityLevel {
  return PALATABILITY_LEVELS.includes(value as PalatabilityLevel);
}

/**
 * Check if digestibility level is valid
 */
export function isValidDigestibilityLevel(
  value: string
): value is DigestibilityLevel {
  return DIGESTIBILITY_LEVELS.includes(value as DigestibilityLevel);
}

/**
 * Check if species type is valid
 */
export function isValidSpeciesType(value: string): value is SpeciesType {
  return SPECIES_TYPES.includes(value as SpeciesType);
}

/**
 * Check if age range is valid
 */
export function isValidAgeRange(value: string): value is AgeRange {
  return AGE_RANGES.includes(value as AgeRange);
}

/**
 * Calculate total macros percentage
 */
export function calculateTotalMacros(food: Partial<FoodFormData>): number {
  const protein = food.protein_percentage || 0;
  const fat = food.fat_percentage || 0;
  const carbs = food.carbs_percentage || 0;
  return protein + fat + carbs;
}

/**
 * Validate macros sum (should be ≤ 100%)
 */
export function validateMacrosSum(food: Partial<FoodFormData>): boolean {
  return calculateTotalMacros(food) <= 100;
}
