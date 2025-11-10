/**
 * Nutrition Calculation Helpers
 * Pet SiKness - Food Management
 */

import type { Foods } from "@/types/database.generated";
import type { FoodType } from "@/types/foods";

// ============================================
// CALCULATION HELPERS
// ============================================

/**
 * Calcular gramos de un macronutriente en materia seca
 */
export function calculateGrams(percentage: number, drySolids: number): number {
  return Math.round((percentage * drySolids) / 100);
}

/**
 * Calcular calorías por porción
 */
export function calculateCaloriesPerServing(
  caloriesPer100g: number,
  servingSizeGrams: number
): number {
  return Math.round((caloriesPer100g * servingSizeGrams) / 100);
}

/**
 * Calcular materia seca (dry matter)
 */
export function calculateDrySolids(moisturePercentage: number): number {
  return 100 - moisturePercentage;
}

/**
 * Calcular suma total de macronutrientes
 */
export function calculateTotalMacros(food: Foods): number {
  const protein = Number(food.protein_percentage) || 0;
  const fat = Number(food.fat_percentage) || 0;
  const carbs = Number(food.carbs_percentage) || 0;
  return protein + fat + carbs;
}

// ============================================
// NUTRITIONAL ANALYSIS
// ============================================

export interface NutritionalProfile {
  highlights: string[];
  warnings: string[];
  score: number; // 0-100
}

/**
 * Analizar perfil nutricional del alimento
 */
export function analyzeNutritionalProfile(food: Foods): NutritionalProfile {
  const highlights: string[] = [];
  const warnings: string[] = [];
  let score = 50; // Base score

  const protein = Number(food.protein_percentage) || 0;
  const fat = Number(food.fat_percentage) || 0;
  const carbs = Number(food.carbs_percentage) || 0;
  const fiber = Number(food.fiber_percentage) || 0;
  const totalMacros = protein + fat + carbs;

  // Alto en proteína
  if (protein >= 30) {
    highlights.push("🥩 Alto en proteína");
    score += 10;
  } else if (protein >= 25) {
    highlights.push("💪 Buena proteína");
    score += 5;
  }

  // Bajo en grasa (saludable para sedentarios)
  if (fat > 0 && fat <= 10) {
    highlights.push("💧 Bajo en grasa");
    score += 5;
  } else if (fat >= 15 && fat <= 20) {
    highlights.push("⚖️ Grasa moderada");
  } else if (fat > 25) {
    warnings.push("⚠️ Alto en grasa");
    score -= 5;
  }

  // Alto en fibra
  if (fiber >= 5) {
    highlights.push("🌾 Alto en fibra");
    score += 5;
  } else if (fiber >= 3) {
    highlights.push("🌿 Buena fibra");
    score += 3;
  }

  // Bajo en carbohidratos (ideal para carnívoros)
  if (carbs > 0 && carbs <= 20) {
    highlights.push("🍃 Bajo en carbohidratos");
    score += 5;
  } else if (carbs > 40) {
    warnings.push("⚠️ Alto en carbohidratos");
    score -= 5;
  }

  // Validación de suma de macros
  if (totalMacros > 100) {
    warnings.push("❌ Error: Suma de macros > 100%");
    score -= 20;
  }

  // Información nutricional completa
  if (protein > 0 && fat > 0 && carbs > 0) {
    score += 10;
  }

  // Ajustar score a rango 0-100
  score = Math.max(0, Math.min(100, score));

  return { highlights, warnings, score };
}

// ============================================
// QUALITY ASSESSMENT
// ============================================

export interface QualityLevel {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
  description: string;
}

/**
 * Evaluar calidad de proteína según tipo de alimento
 */
export function getProteinQuality(
  percentage: number,
  foodType: FoodType
): QualityLevel | null {
  // Estándares por tipo de alimento
  const standards: Record<
    FoodType,
    { low: number; optimal: number; high: number }
  > = {
    dry: { low: 25, optimal: 30, high: 40 },
    wet: { low: 8, optimal: 10, high: 15 },
    raw: { low: 15, optimal: 18, high: 25 },
    homemade: { low: 20, optimal: 25, high: 35 },
    treat: { low: 10, optimal: 15, high: 20 },
    supplement: { low: 0, optimal: 5, high: 10 },
  };

  const standard = standards[foodType];

  if (percentage < standard.low) {
    return {
      label: "Baja",
      variant: "destructive",
      description: `Menor a ${standard.low}%`,
    };
  } else if (percentage >= standard.low && percentage < standard.optimal) {
    return {
      label: "Regular",
      variant: "secondary",
      description: `${standard.low}-${standard.optimal}%`,
    };
  } else if (percentage >= standard.optimal && percentage < standard.high) {
    return {
      label: "Óptima",
      variant: "default",
      description: `${standard.optimal}-${standard.high}%`,
    };
  } else {
    return {
      label: "Muy alta",
      variant: "outline",
      description: `Más de ${standard.high}%`,
    };
  }
}

/**
 * Evaluar calidad de grasa
 */
export function getFatQuality(percentage: number): QualityLevel | null {
  if (percentage === 0) return null;

  if (percentage < 10) {
    return {
      label: "Bajo",
      variant: "default",
      description: "Ideal para sedentarios",
    };
  } else if (percentage >= 10 && percentage < 15) {
    return {
      label: "Moderado",
      variant: "secondary",
      description: "Equilibrado",
    };
  } else if (percentage >= 15 && percentage < 25) {
    return {
      label: "Alto",
      variant: "outline",
      description: "Para activos",
    };
  } else {
    return {
      label: "Muy alto",
      variant: "destructive",
      description: "Solo para muy activos",
    };
  }
}

/**
 * Evaluar calidad de fibra
 */
export function getFiberQuality(percentage: number): QualityLevel | null {
  if (percentage === 0) return null;

  if (percentage < 2) {
    return {
      label: "Baja",
      variant: "secondary",
      description: "Poca fibra",
    };
  } else if (percentage >= 2 && percentage < 5) {
    return {
      label: "Normal",
      variant: "default",
      description: "Adecuada",
    };
  } else if (percentage >= 5 && percentage < 8) {
    return {
      label: "Alta",
      variant: "outline",
      description: "Buena digestión",
    };
  } else {
    return {
      label: "Muy alta",
      variant: "destructive",
      description: "Puede causar problemas",
    };
  }
}

// ============================================
// MACRO COLORS
// ============================================

export const MACRO_COLORS = {
  protein: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    progress: "bg-blue-500",
    light: "bg-blue-50",
  },
  fat: {
    bg: "bg-yellow-100",
    text: "text-yellow-700",
    progress: "bg-yellow-500",
    light: "bg-yellow-50",
  },
  carbs: {
    bg: "bg-green-100",
    text: "text-green-700",
    progress: "bg-green-500",
    light: "bg-green-50",
  },
  fiber: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    progress: "bg-orange-500",
    light: "bg-orange-50",
  },
} as const;
