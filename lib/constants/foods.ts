/**
 * Constants for Foods Domain
 * Pet SiKness - Food Management
 *
 * Human-readable labels and options for UI
 */

import type {
  FoodType,
  PalatabilityLevel,
  DigestibilityLevel,
  SpeciesType,
  AgeRange,
} from "@/types/foods";

// ============================================
// Food Types
// ============================================

export const FOOD_TYPE_OPTIONS: Array<{
  value: FoodType;
  label: string;
  emoji: string;
  description: string;
}> = [
  {
    value: "dry",
    label: "Pienso Seco",
    emoji: "🥘",
    description: "Comida seca (croquetas, kibble)",
  },
  {
    value: "wet",
    label: "Comida Húmeda",
    emoji: "🥫",
    description: "Latas, sobres, tarrinas",
  },
  {
    value: "raw",
    label: "Dieta BARF",
    emoji: "🥩",
    description: "Alimentación cruda (BARF, raw feeding)",
  },
  {
    value: "homemade",
    label: "Comida Casera",
    emoji: "🍲",
    description: "Comida casera cocinada",
  },
  {
    value: "treat",
    label: "Snacks/Premios",
    emoji: "🦴",
    description: "Golosinas, premios, treats",
  },
  {
    value: "supplement",
    label: "Suplemento",
    emoji: "💊",
    description: "Suplementos nutricionales",
  },
];

// ============================================
// Palatability Levels (Taste/Preference)
// ============================================

export const PALATABILITY_OPTIONS: Array<{
  value: PalatabilityLevel;
  label: string;
  emoji: string;
  color: string;
}> = [
  {
    value: "low",
    label: "Baja",
    emoji: "�",
    color: "text-red-600",
  },
  {
    value: "medium",
    label: "Media",
    emoji: "�",
    color: "text-yellow-500",
  },
  {
    value: "high",
    label: "Alta",
    emoji: "😋",
    color: "text-green-600",
  },
];

// ============================================
// Digestibility Levels (Digestion Quality)
// ============================================

export const DIGESTIBILITY_OPTIONS: Array<{
  value: DigestibilityLevel;
  label: string;
  emoji: string;
  color: string;
}> = [
  {
    value: "poor",
    label: "Pobre",
    emoji: "🔴",
    color: "text-red-600",
  },
  {
    value: "fair",
    label: "Regular",
    emoji: "🟠",
    color: "text-orange-500",
  },
  {
    value: "good",
    label: "Buena",
    emoji: "🟡",
    color: "text-yellow-500",
  },
  {
    value: "excellent",
    label: "Excelente",
    emoji: "🟢",
    color: "text-green-600",
  },
];

// ============================================
// Species
// ============================================

export const SPECIES_OPTIONS: Array<{
  value: SpeciesType;
  label: string;
  emoji: string;
}> = [
  {
    value: "cat",
    label: "Gato",
    emoji: "🐱",
  },
  {
    value: "dog",
    label: "Perro",
    emoji: "🐶",
  },
  {
    value: "bird",
    label: "Ave",
    emoji: "🐦",
  },
  {
    value: "rabbit",
    label: "Conejo",
    emoji: "🐰",
  },
  {
    value: "other",
    label: "Otra",
    emoji: "🐾",
  },
];

// ============================================
// Age Ranges
// ============================================

export const AGE_RANGE_OPTIONS: Array<{
  value: AgeRange;
  label: string;
  description: string;
}> = [
  {
    value: "kitten/puppy",
    label: "Cachorro",
    description: "0-12 meses (gato o perro)",
  },
  {
    value: "adult",
    label: "Adulto",
    description: "1-7 años",
  },
  {
    value: "senior",
    label: "Senior",
    description: "7+ años",
  },
  {
    value: "all_ages",
    label: "Todas las edades",
    description: "All life stages",
  },
];

// ============================================
// Nutritional Ranges (for validation UI)
// ============================================

/**
 * Recommended nutritional ranges by species
 */
export const NUTRITIONAL_RANGES = {
  cat: {
    protein: { min: 26, max: 45, unit: "%" },
    fat: { min: 9, max: 25, unit: "%" },
    carbs: { min: 0, max: 10, unit: "%" },
    fiber: { min: 1, max: 5, unit: "%" },
    moisture: { min: 8, max: 78, unit: "%" },
    calories: { min: 300, max: 500, unit: "kcal/100g" },
  },
  dog: {
    protein: { min: 18, max: 35, unit: "%" },
    fat: { min: 5, max: 20, unit: "%" },
    carbs: { min: 0, max: 50, unit: "%" },
    fiber: { min: 1, max: 5, unit: "%" },
    moisture: { min: 8, max: 78, unit: "%" },
    calories: { min: 300, max: 450, unit: "kcal/100g" },
  },
} as const;

// ============================================
// Default Values
// ============================================

/**
 * Default food form values
 */
export const DEFAULT_FOOD_VALUES = {
  name: "",
  brand: "",
  food_type: "dry" as FoodType,
  calories_per_100g: undefined,
  protein_percentage: undefined,
  fat_percentage: undefined,
  carbs_percentage: undefined,
  fiber_percentage: undefined,
  moisture_percentage: undefined,
  ingredients: "",
  serving_size_grams: undefined,
  package_size_grams: undefined,
  price_per_package: undefined,
  palatability: undefined,
  digestibility: undefined,
  suitable_for_species: [] as SpeciesType[],
  age_range: "all" as AgeRange,
} as const;

// ============================================
// UI Messages
// ============================================

export const FOOD_MESSAGES = {
  created: "✅ Alimento creado exitosamente",
  updated: "✅ Alimento actualizado exitosamente",
  deleted: "✅ Alimento eliminado exitosamente",
  restored: "✅ Alimento restaurado exitosamente",
  createError: "❌ Error al crear alimento",
  updateError: "❌ Error al actualizar alimento",
  deleteError: "❌ Error al eliminar alimento",
  notFound: "❌ Alimento no encontrado",
  loadError: "❌ Error al cargar alimentos",
  macrosExceeded: "⚠️ Los macronutrientes suman más de 100%",
  confirmDelete: "¿Eliminar este alimento?",
  confirmDeleteMessage:
    "Esta acción desactivará el alimento. Podrás restaurarlo después.",
} as const;

// ============================================
// Search Configuration
// ============================================

/**
 * Searchable fields for food search
 */
export const FOOD_SEARCHABLE_FIELDS = ["name", "brand", "ingredients"] as const;

/**
 * Sort options for food list
 */
export const FOOD_SORT_OPTIONS = [
  { value: "name", label: "Nombre A-Z" },
  { value: "-name", label: "Nombre Z-A" },
  { value: "created_at", label: "Más reciente" },
  { value: "-created_at", label: "Más antiguo" },
  { value: "protein_percentage", label: "Mayor proteína" },
  { value: "-protein_percentage", label: "Menor proteína" },
  { value: "calories_per_100g", label: "Mayor calorías" },
  { value: "-calories_per_100g", label: "Menor calorías" },
  { value: "price_per_package", label: "Mayor precio" },
  { value: "-price_per_package", label: "Menor precio" },
] as const;

// ============================================
// Validation Constraints
// ============================================

/**
 * Field constraints for validation
 */
export const FOOD_CONSTRAINTS = {
  name: {
    minLength: 1,
    maxLength: 200,
  },
  brand: {
    maxLength: 100,
  },
  percentage: {
    min: 0,
    max: 100,
  },
  macrosSum: {
    max: 100,
  },
  calories: {
    min: 0,
    max: 1000,
  },
  price: {
    min: 0,
    max: 999999.99,
  },
  weight: {
    min: 1,
    max: 100000, // 100kg max package
  },
} as const;

// ============================================
// Helper Functions
// ============================================

/**
 * Get label maps for quick lookups
 */
export const FOOD_TYPE_LABELS: Record<FoodType, string> = Object.fromEntries(
  FOOD_TYPE_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<FoodType, string>;

export const PALATABILITY_LABELS: Record<PalatabilityLevel, string> =
  Object.fromEntries(
    PALATABILITY_OPTIONS.map((opt) => [opt.value, opt.label])
  ) as Record<PalatabilityLevel, string>;

export const DIGESTIBILITY_LABELS: Record<DigestibilityLevel, string> =
  Object.fromEntries(
    DIGESTIBILITY_OPTIONS.map((opt) => [opt.value, opt.label])
  ) as Record<DigestibilityLevel, string>;

export const SPECIES_LABELS: Record<SpeciesType, string> = Object.fromEntries(
  SPECIES_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<SpeciesType, string>;

export const AGE_RANGE_LABELS: Record<AgeRange, string> = Object.fromEntries(
  AGE_RANGE_OPTIONS.map((opt) => [opt.value, opt.label])
) as Record<AgeRange, string>;

/**
 * Get emoji for species
 */
export function getSpeciesEmoji(species: string): string {
  const option = SPECIES_OPTIONS.find((opt) => opt.value === species);
  return option?.emoji || "🐾";
}

/**
 * Get emoji for food type
 */
export function getFoodTypeEmoji(type: string): string {
  const option = FOOD_TYPE_OPTIONS.find((opt) => opt.value === type);
  return option?.emoji || "🍽️";
}

/**
 * Get emoji for palatability level
 */
export function getPalatabilityEmoji(palatability: string): string {
  const option = PALATABILITY_OPTIONS.find((opt) => opt.value === palatability);
  return option?.emoji || "😐";
}

/**
 * Get emoji for digestibility level
 */
export function getDigestibilityEmoji(digestibility: string): string {
  const option = DIGESTIBILITY_OPTIONS.find(
    (opt) => opt.value === digestibility
  );
  return option?.emoji || "🟡";
}
