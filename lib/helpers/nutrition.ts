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
 * Convertir porcentaje en base húmeda a base seca
 */
export function convertToDryMatterBasis(
  percentage: number,
  moisturePercentage: number
): number {
  const drySolids = calculateDrySolids(moisturePercentage);
  if (drySolids <= 0) return 0;
  return Number(((percentage / drySolids) * 100).toFixed(1));
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
 * Analizar perfil nutricional del alimento según especie objetivo
 */
export function analyzeNutritionalProfile(
  food: Foods,
  suitableSpecies?: string[] | null
): NutritionalProfile {
  const highlights: string[] = [];
  const warnings: string[] = [];
  let score = 50; // Base score

  const protein = Number(food.protein_percentage) || 0;
  const fat = Number(food.fat_percentage) || 0;
  const carbs = Number(food.carbs_percentage) || 0;
  const fiber = Number(food.fiber_percentage) || 0;
  const moisture = Number(food.moisture_percentage) || 0;
  const totalMacros = protein + fat + carbs;

  // Determinar especie objetivo
  const isCarnivore =
    suitableSpecies?.includes("cat") && !suitableSpecies.includes("dog");
  const isOmnivore =
    suitableSpecies?.includes("dog") && !suitableSpecies.includes("cat");

  // Normalizar a base seca si tiene humedad
  const proteinDry =
    moisture > 20 ? convertToDryMatterBasis(protein, moisture) : protein;
  const fatDry = moisture > 20 ? convertToDryMatterBasis(fat, moisture) : fat;
  const carbsDry =
    moisture > 20 ? convertToDryMatterBasis(carbs, moisture) : carbs;

  // ANÁLISIS PARA CARNÍVOROS (GATOS)
  if (isCarnivore) {
    // Proteína (38-50% óptimo en base seca)
    if (proteinDry >= 45) {
      highlights.push("🥩 Excelente proteína para carnívoros");
      score += 15;
    } else if (proteinDry >= 38) {
      highlights.push("💪 Proteína óptima");
      score += 10;
    } else if (proteinDry >= 30) {
      highlights.push("🍖 Buena proteína");
      score += 5;
    } else {
      warnings.push("⚠️ Proteína baja para gatos");
      score -= 10;
    }

    // Grasa (25-55% óptimo - fuente principal de energía)
    if (fatDry >= 40 && fatDry <= 55) {
      highlights.push("� Grasa excelente (dieta carnívora natural)");
      score += 15;
    } else if (fatDry >= 25 && fatDry < 40) {
      highlights.push("⚖️ Grasa óptima");
      score += 10;
    } else if (fatDry >= 15 && fatDry < 25) {
      highlights.push("💧 Grasa mínima aceptable");
      score += 3;
    } else if (fatDry < 15) {
      warnings.push("⚠️ Grasa insuficiente para carnívoros");
      score -= 10;
    }

    // Carbohidratos (<5% ideal para gatos)
    if (carbsDry < 5) {
      highlights.push("✨ Bajo en carbohidratos (perfecto)");
      score += 15;
    } else if (carbsDry < 10) {
      highlights.push("🍃 Carbohidratos aceptables");
      score += 5;
    } else if (carbsDry >= 20) {
      warnings.push("⚠️ Alto en carbohidratos (riesgo diabetes)");
      score -= 15;
    } else {
      warnings.push("⚠️ Carbohidratos algo elevados");
      score -= 5;
    }

    // Fibra (<2% ideal)
    if (fiber < 2) {
      highlights.push("🎯 Fibra óptima para carnívoros");
      score += 5;
    } else if (fiber >= 4) {
      warnings.push("⚠️ Fibra elevada (digestivo corto)");
      score -= 5;
    }
  }
  // ANÁLISIS PARA OMNÍVOROS (PERROS)
  else if (isOmnivore) {
    // Proteína (25-45% óptimo)
    if (proteinDry >= 35) {
      highlights.push("🥩 Alto en proteína");
      score += 10;
    } else if (proteinDry >= 25) {
      highlights.push("💪 Buena proteína");
      score += 5;
    }

    // Grasa (15-25% óptimo)
    if (fatDry >= 10 && fatDry <= 25) {
      highlights.push("⚖️ Grasa equilibrada");
      score += 5;
    } else if (fatDry > 30) {
      warnings.push("⚠️ Alto en grasa");
      score -= 5;
    }

    // Fibra (2-5% bueno para digestión)
    if (fiber >= 3 && fiber <= 6) {
      highlights.push("🌿 Buena fibra");
      score += 5;
    }

    // Carbohidratos (toleran hasta 40%)
    if (carbsDry < 20) {
      highlights.push("🍃 Bajo en carbohidratos");
      score += 5;
    } else if (carbsDry > 50) {
      warnings.push("⚠️ Muy alto en carbohidratos");
      score -= 5;
    }
  }
  // ANÁLISIS GENÉRICO (múltiples especies)
  else {
    if (proteinDry >= 30) {
      highlights.push("🥩 Alto en proteína");
      score += 10;
    }
    if (fatDry >= 15 && fatDry <= 30) {
      highlights.push("⚖️ Grasa moderada");
      score += 5;
    }
    if (carbsDry < 20) {
      highlights.push("🍃 Bajo en carbohidratos");
      score += 5;
    }
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
 * Evaluar calidad de proteína según tipo de alimento y especies
 * Considera la humedad para normalizar a base seca si es necesario
 */
export function getProteinQuality(
  percentage: number,
  foodType: FoodType,
  suitableSpecies?: string[] | null,
  moisture?: number | null
): QualityLevel | null {
  // Si tiene alta humedad (>20%), normalizar a base seca para comparar
  let proteinToEvaluate = percentage;
  let isMoisture = false;

  if (moisture && moisture > 20) {
    proteinToEvaluate = convertToDryMatterBasis(percentage, moisture);
    isMoisture = true;
  }

  // Determinar si son carnívoros (gatos) o omnívoros (perros)
  const isCarnivore =
    suitableSpecies?.includes("cat") && !suitableSpecies.includes("dog");
  const isOmnivore =
    suitableSpecies?.includes("dog") && !suitableSpecies.includes("cat");

  // Estándares por tipo de alimento y especie (en base seca)
  interface Standard {
    low: number;
    optimal: number;
    high: number;
  }

  const getStandard = (): Standard => {
    // CARNÍVOROS (gatos) - carnívoros obligados
    if (isCarnivore) {
      switch (foodType) {
        case "dry":
          return { low: 32, optimal: 38, high: 50 }; // Pienso seco: min 30-32%
        case "wet":
        case "raw":
          // Carne fresca real: 15-20% proteína base húmeda = 38-50% base seca
          // Tu BARF: 14.8% húmeda (62.6% humedad) = 39.6% seca ✅
          return { low: 30, optimal: 38, high: 50 }; // Base seca
        case "homemade":
          return { low: 32, optimal: 40, high: 52 };
        case "treat":
          return { low: 25, optimal: 35, high: 50 };
        case "supplement":
          return { low: 0, optimal: 10, high: 30 };
      }
    }

    // OMNÍVOROS (perros) - necesitan menos proteína
    if (isOmnivore) {
      switch (foodType) {
        case "dry":
          return { low: 22, optimal: 28, high: 38 }; // Perros: min 18-22%
        case "wet":
        case "raw":
          return { low: 25, optimal: 30, high: 45 }; // Base seca
        case "homemade":
          return { low: 25, optimal: 30, high: 40 };
        case "treat":
          return { low: 15, optimal: 25, high: 40 };
        case "supplement":
          return { low: 0, optimal: 5, high: 20 };
      }
    }

    // GENÉRICO (múltiples especies o sin especificar)
    switch (foodType) {
      case "dry":
        return { low: 25, optimal: 32, high: 45 };
      case "wet":
      case "raw":
        return { low: 30, optimal: 35, high: 50 }; // Base seca
      case "homemade":
        return { low: 28, optimal: 35, high: 48 };
      case "treat":
        return { low: 20, optimal: 30, high: 45 };
      case "supplement":
        return { low: 0, optimal: 8, high: 25 };
    }
  };

  const standard = getStandard();

  // Evaluar calidad
  let quality: QualityLevel;

  if (proteinToEvaluate < standard.low) {
    quality = {
      label: "Baja",
      variant: "destructive",
      description: `Menor a ${standard.low}% (base seca)`,
    };
  } else if (
    proteinToEvaluate >= standard.low &&
    proteinToEvaluate < standard.optimal
  ) {
    quality = {
      label: "Buena",
      variant: "secondary",
      description: `${standard.low}-${standard.optimal}% (base seca)`,
    };
  } else if (
    proteinToEvaluate >= standard.optimal &&
    proteinToEvaluate < standard.high
  ) {
    quality = {
      label: "Óptima",
      variant: "default",
      description: `${standard.optimal}-${standard.high}% (base seca)`,
    };
  } else {
    quality = {
      label: "Excelente",
      variant: "outline",
      description: `≥${standard.high}% (carnívoro ideal)`,
    };
  }

  // Si normalizamos, añadir nota explicativa
  if (isMoisture) {
    quality.description += ` • Base húmeda: ${percentage}%`;
  }

  return quality;
}

/**
 * Evaluar calidad de grasa según especie
 */
export function getFatQuality(
  percentage: number,
  suitableSpecies?: string[] | null,
  moisture?: number | null
): QualityLevel | null {
  if (percentage === 0) return null;

  // Normalizar a base seca si tiene humedad
  let fatToEvaluate = percentage;
  if (moisture && moisture > 20) {
    fatToEvaluate = convertToDryMatterBasis(percentage, moisture);
  }

  const isCarnivore =
    suitableSpecies?.includes("cat") && !suitableSpecies.includes("dog");

  // GATOS: La grasa es su FUENTE PRINCIPAL DE ENERGÍA (no carbohidratos)
  if (isCarnivore) {
    if (fatToEvaluate < 15) {
      return {
        label: "Baja",
        variant: "destructive",
        description: "Insuficiente para carnívoros",
      };
    } else if (fatToEvaluate >= 15 && fatToEvaluate < 25) {
      return {
        label: "Mínima",
        variant: "secondary",
        description: "Aceptable pero justa",
      };
    } else if (fatToEvaluate >= 25 && fatToEvaluate < 40) {
      return {
        label: "Óptima",
        variant: "default",
        description: "Ideal para carnívoros",
      };
    } else if (fatToEvaluate >= 40 && fatToEvaluate < 55) {
      return {
        label: "Excelente",
        variant: "outline",
        description: "Dieta carnívora natural",
      };
    } else {
      return {
        label: "Muy alta",
        variant: "secondary",
        description: "Tipo presa entera",
      };
    }
  }

  // Perros y genérico
  if (fatToEvaluate < 10) {
    return {
      label: "Baja",
      variant: "default",
      description: "Ideal para sedentarios",
    };
  } else if (fatToEvaluate >= 10 && fatToEvaluate < 15) {
    return {
      label: "Moderada",
      variant: "secondary",
      description: "Equilibrada",
    };
  } else if (fatToEvaluate >= 15 && fatToEvaluate < 25) {
    return {
      label: "Alta",
      variant: "outline",
      description: "Para activos",
    };
  } else {
    return {
      label: "Muy alta",
      variant: "destructive",
      description: "Solo muy activos",
    };
  }
}

/**
 * Evaluar calidad de carbohidratos según especie
 */
export function getCarbsQuality(
  percentage: number,
  suitableSpecies?: string[] | null,
  moisture?: number | null
): QualityLevel | null {
  if (percentage === 0) {
    return {
      label: "Perfecto",
      variant: "default",
      description: "Sin carbohidratos (carnívoro ideal)",
    };
  }

  // Normalizar a base seca si tiene humedad
  let carbsToEvaluate = percentage;
  if (moisture && moisture > 20) {
    carbsToEvaluate = convertToDryMatterBasis(percentage, moisture);
  }

  const isCarnivore =
    suitableSpecies?.includes("cat") && !suitableSpecies.includes("dog");

  // CARNÍVOROS (gatos) - metabolismo limitado de carbohidratos
  if (isCarnivore) {
    if (carbsToEvaluate < 5) {
      return {
        label: "Óptimo",
        variant: "default",
        description: "Ideal para carnívoros",
      };
    } else if (carbsToEvaluate >= 5 && carbsToEvaluate < 10) {
      return {
        label: "Aceptable",
        variant: "secondary",
        description: "Tolerable para gatos",
      };
    } else if (carbsToEvaluate >= 10 && carbsToEvaluate < 20) {
      return {
        label: "Alto",
        variant: "outline",
        description: "Elevado para carnívoros",
      };
    } else {
      return {
        label: "Muy alto",
        variant: "destructive",
        description: "Excesivo (riesgo diabetes)",
      };
    }
  }

  // OMNÍVOROS (perros) - toleran mejor los carbohidratos
  if (carbsToEvaluate < 20) {
    return {
      label: "Bajo",
      variant: "default",
      description: "Bajo en carbohidratos",
    };
  } else if (carbsToEvaluate >= 20 && carbsToEvaluate < 40) {
    return {
      label: "Moderado",
      variant: "secondary",
      description: "Equilibrado para omnívoros",
    };
  } else if (carbsToEvaluate >= 40 && carbsToEvaluate < 55) {
    return {
      label: "Alto",
      variant: "outline",
      description: "Rico en carbohidratos",
    };
  } else {
    return {
      label: "Muy alto",
      variant: "destructive",
      description: "Excesivo",
    };
  }
}

/**
 * Evaluar calidad de fibra según especie
 */
export function getFiberQuality(
  percentage: number,
  suitableSpecies?: string[] | null
): QualityLevel | null {
  if (percentage === 0) return null;

  const isCarnivore =
    suitableSpecies?.includes("cat") && !suitableSpecies.includes("dog");

  // CARNÍVOROS (gatos) - necesitan POCA fibra
  if (isCarnivore) {
    if (percentage < 2) {
      return {
        label: "Óptima",
        variant: "default",
        description: "Ideal para carnívoros",
      };
    } else if (percentage >= 2 && percentage < 4) {
      return {
        label: "Aceptable",
        variant: "secondary",
        description: "Moderada para gatos",
      };
    } else if (percentage >= 4 && percentage < 6) {
      return {
        label: "Alta",
        variant: "outline",
        description: "Algo elevada",
      };
    } else {
      return {
        label: "Muy alta",
        variant: "destructive",
        description: "Excesiva para carnívoros",
      };
    }
  }

  // OMNÍVOROS (perros) y GENÉRICO
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
