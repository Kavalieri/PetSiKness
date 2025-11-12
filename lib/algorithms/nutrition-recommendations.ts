/**
 * Nutrition Recommendations Algorithm
 * Pet SiKness - Sistema de recomendaciones nutricionales inteligentes
 *
 * Este módulo implementa algoritmos para:
 * - Analizar historial nutricional agregado
 * - Detectar deficiencias basadas en estándares species-specific
 * - Sugerir alimentos del catálogo que cubran deficiencias
 * - Calcular porciones óptimas recomendadas
 */

import type { Foods, Pets } from "@/types/database.generated";
import { convertToDryMatterBasis } from "@/lib/helpers/nutrition";

// ============================================
// TYPES
// ============================================

/**
 * Análisis nutricional agregado de un período
 */
export interface NutritionalAnalysis {
  petId: string;
  petName: string;
  species: string;
  periodDays: number;

  // Consumo total en gramos (base seca)
  totalProteinGrams: number;
  totalFatGrams: number;
  totalCarbsGrams: number;
  totalFiberGrams: number;
  totalCalories: number;

  // Consumo promedio diario
  avgDailyProteinGrams: number;
  avgDailyFatGrams: number;
  avgDailyCarbsGrams: number;
  avgDailyFiberGrams: number;
  avgDailyCalories: number;

  // % de composición nutricional consumida
  consumedProteinPercentage: number;
  consumedFatPercentage: number;
  consumedCarbsPercentage: number;
  consumedFiberPercentage: number;
}

/**
 * Requerimientos nutricionales por especie
 */
export interface NutritionalRequirements {
  species: string;
  // Rangos recomendados (% base seca)
  proteinMin: number;
  proteinMax: number;
  proteinOptimal: number;
  fatMin: number;
  fatMax: number;
  fatOptimal: number;
  carbsMax: number;
  carbsOptimal: number;
  fiberMin: number;
  fiberMax: number;
  fiberOptimal: number;
}

/**
 * Gap nutricional detectado
 */
export interface NutritionalGap {
  nutrient: "protein" | "fat" | "carbs" | "fiber";
  nutrientLabel: string;
  current: number; // % actual consumido
  required: number; // % requerido (optimal)
  gap: number; // Diferencia en % (positivo = deficiencia, negativo = exceso)
  severity: "critical" | "moderate" | "minor" | "ok" | "excess";
  recommendation: string;
}

/**
 * Recomendación de alimento
 */
export interface FoodRecommendation {
  food: Foods;
  score: number; // 0-100 (qué tan bien cubre las deficiencias)
  matchedGaps: NutritionalGap[];
  suggestedPortionGrams: number;
  reasoning: string[];
}

/**
 * Resultado completo de recomendaciones
 */
export interface RecommendationResult {
  analysis: NutritionalAnalysis;
  requirements: NutritionalRequirements;
  gaps: NutritionalGap[];
  recommendations: FoodRecommendation[];
}

// ============================================
// NUTRITIONAL REQUIREMENTS (Species-Specific)
// ============================================

/**
 * Estándares nutricionales por especie
 * Basado en research y estándares AAFCO/NRC
 */
const SPECIES_REQUIREMENTS: Record<string, NutritionalRequirements> = {
  cat: {
    species: "cat",
    proteinMin: 30,
    proteinMax: 50,
    proteinOptimal: 40,
    fatMin: 25,
    fatMax: 55,
    fatOptimal: 45, // Gatos carnívoros: grasa es fuente primaria de energía
    carbsMax: 10,
    carbsOptimal: 5, // Idealmente <5% para prevenir diabetes
    fiberMin: 1,
    fiberMax: 5,
    fiberOptimal: 2,
  },
  dog: {
    species: "dog",
    proteinMin: 22,
    proteinMax: 40,
    proteinOptimal: 28,
    fatMin: 10,
    fatMax: 30,
    fatOptimal: 18,
    carbsMax: 50,
    carbsOptimal: 30,
    fiberMin: 2,
    fiberMax: 8,
    fiberOptimal: 4,
  },
  // Otros (genérico conservador)
  default: {
    species: "other",
    proteinMin: 20,
    proteinMax: 40,
    proteinOptimal: 28,
    fatMin: 10,
    fatMax: 25,
    fatOptimal: 15,
    carbsMax: 50,
    carbsOptimal: 35,
    fiberMin: 2,
    fiberMax: 8,
    fiberOptimal: 5,
  },
};

/**
 * Obtener requerimientos nutricionales para una especie
 */
export function getSpeciesRequirements(
  species: string
): NutritionalRequirements {
  return SPECIES_REQUIREMENTS[species] || SPECIES_REQUIREMENTS.default;
}

// ============================================
// ALGORITMO 1: ANÁLISIS NUTRICIONAL AGREGADO
// ============================================

/**
 * Analizar historial nutricional agregado de un período
 *
 * @param feedingHistory - Array de registros de alimentación con datos nutricionales
 * @param pet - Información de la mascota
 * @param periodDays - Número de días del período analizado
 * @returns Análisis nutricional completo
 */
export function analyzeNutritionalIntake(
  feedingHistory: Array<{
    amount_eaten_grams: number;
    food: {
      protein_percentage: number | null;
      fat_percentage: number | null;
      carbs_percentage: number | null;
      fiber_percentage: number | null;
      moisture_percentage: number | null;
      calories_per_100g: number | null;
    };
  }>,
  pet: Pets,
  periodDays: number
): NutritionalAnalysis {
  let totalProteinGrams = 0;
  let totalFatGrams = 0;
  let totalCarbsGrams = 0;
  let totalFiberGrams = 0;
  let totalCalories = 0;
  let totalEatenGrams = 0;

  // Acumular nutrientes de cada alimentación
  for (const feeding of feedingHistory) {
    const eatenGrams = feeding.amount_eaten_grams;
    const moisture = Number(feeding.food.moisture_percentage) || 0;

    // Convertir a base seca si es necesario
    const proteinPct =
      moisture > 20
        ? convertToDryMatterBasis(
            Number(feeding.food.protein_percentage) || 0,
            moisture
          )
        : Number(feeding.food.protein_percentage) || 0;

    const fatPct =
      moisture > 20
        ? convertToDryMatterBasis(
            Number(feeding.food.fat_percentage) || 0,
            moisture
          )
        : Number(feeding.food.fat_percentage) || 0;

    const carbsPct =
      moisture > 20
        ? convertToDryMatterBasis(
            Number(feeding.food.carbs_percentage) || 0,
            moisture
          )
        : Number(feeding.food.carbs_percentage) || 0;

    const fiberPct =
      moisture > 20
        ? convertToDryMatterBasis(
            Number(feeding.food.fiber_percentage) || 0,
            moisture
          )
        : Number(feeding.food.fiber_percentage) || 0;

    // Calcular gramos de cada nutriente
    totalProteinGrams += (eatenGrams * proteinPct) / 100;
    totalFatGrams += (eatenGrams * fatPct) / 100;
    totalCarbsGrams += (eatenGrams * carbsPct) / 100;
    totalFiberGrams += (eatenGrams * fiberPct) / 100;

    // Calorías
    const caloriesPer100g = Number(feeding.food.calories_per_100g) || 0;
    totalCalories += (eatenGrams * caloriesPer100g) / 100;

    totalEatenGrams += eatenGrams;
  }

  // Calcular promedios diarios
  const avgDailyProteinGrams = totalProteinGrams / periodDays;
  const avgDailyFatGrams = totalFatGrams / periodDays;
  const avgDailyCarbsGrams = totalCarbsGrams / periodDays;
  const avgDailyFiberGrams = totalFiberGrams / periodDays;
  const avgDailyCalories = totalCalories / periodDays;

  // Calcular % de composición nutricional consumida
  const totalMacroGrams =
    totalProteinGrams + totalFatGrams + totalCarbsGrams + totalFiberGrams;

  const consumedProteinPercentage =
    totalMacroGrams > 0 ? (totalProteinGrams / totalMacroGrams) * 100 : 0;
  const consumedFatPercentage =
    totalMacroGrams > 0 ? (totalFatGrams / totalMacroGrams) * 100 : 0;
  const consumedCarbsPercentage =
    totalMacroGrams > 0 ? (totalCarbsGrams / totalMacroGrams) * 100 : 0;
  const consumedFiberPercentage =
    totalMacroGrams > 0 ? (totalFiberGrams / totalMacroGrams) * 100 : 0;

  return {
    petId: String(pet.id),
    petName: pet.name,
    species: pet.species,
    periodDays,
    totalProteinGrams,
    totalFatGrams,
    totalCarbsGrams,
    totalFiberGrams,
    totalCalories,
    avgDailyProteinGrams,
    avgDailyFatGrams,
    avgDailyCarbsGrams,
    avgDailyFiberGrams,
    avgDailyCalories,
    consumedProteinPercentage,
    consumedFatPercentage,
    consumedCarbsPercentage,
    consumedFiberPercentage,
  };
}

// ============================================
// ALGORITMO 2: DETECCIÓN DE DEFICIENCIAS
// ============================================

/**
 * Detectar gaps nutricionales comparando consumo vs requerimientos
 *
 * @param analysis - Análisis nutricional del período
 * @param requirements - Requerimientos nutricionales de la especie
 * @returns Array de gaps detectados
 */
export function detectNutritionalGaps(
  analysis: NutritionalAnalysis,
  requirements: NutritionalRequirements
): NutritionalGap[] {
  const gaps: NutritionalGap[] = [];

  // Función helper para calcular severidad
  const calculateSeverity = (
    gap: number,
    isCarbs: boolean = false
  ): NutritionalGap["severity"] => {
    const absGap = Math.abs(gap);

    if (isCarbs && gap < 0) {
      // Para carbos, el exceso es problemático
      if (absGap > 15) return "critical";
      if (absGap > 10) return "moderate";
      if (absGap > 5) return "minor";
      return "ok";
    }

    if (gap > 0) {
      // Deficiencia
      if (absGap > 15) return "critical";
      if (absGap > 10) return "moderate";
      if (absGap > 5) return "minor";
      return "ok";
    } else {
      // Exceso
      if (absGap > 20) return "excess";
      return "ok";
    }
  };

  // GAP 1: Proteína
  const proteinGap = requirements.proteinOptimal - analysis.consumedProteinPercentage;
  gaps.push({
    nutrient: "protein",
    nutrientLabel: "Proteína",
    current: analysis.consumedProteinPercentage,
    required: requirements.proteinOptimal,
    gap: proteinGap,
    severity: calculateSeverity(proteinGap),
    recommendation:
      proteinGap > 5
        ? `Incrementar proteína en ${proteinGap.toFixed(1)}%`
        : proteinGap < -5
        ? `Reducir proteína en ${Math.abs(proteinGap).toFixed(1)}%`
        : "Nivel de proteína adecuado",
  });

  // GAP 2: Grasa
  const fatGap = requirements.fatOptimal - analysis.consumedFatPercentage;
  gaps.push({
    nutrient: "fat",
    nutrientLabel: "Grasa",
    current: analysis.consumedFatPercentage,
    required: requirements.fatOptimal,
    gap: fatGap,
    severity: calculateSeverity(fatGap),
    recommendation:
      fatGap > 5
        ? `Incrementar grasa en ${fatGap.toFixed(1)}%`
        : fatGap < -5
        ? `Reducir grasa en ${Math.abs(fatGap).toFixed(1)}%`
        : "Nivel de grasa adecuado",
  });

  // GAP 3: Carbohidratos
  const carbsGap = requirements.carbsOptimal - analysis.consumedCarbsPercentage;
  gaps.push({
    nutrient: "carbs",
    nutrientLabel: "Carbohidratos",
    current: analysis.consumedCarbsPercentage,
    required: requirements.carbsOptimal,
    gap: carbsGap,
    severity: calculateSeverity(carbsGap, true),
    recommendation:
      carbsGap > 0
        ? "Nivel de carbohidratos bajo (ideal para carnívoros)"
        : carbsGap < -10
        ? `Reducir carbohidratos en ${Math.abs(carbsGap).toFixed(1)}% (riesgo diabetes)`
        : "Nivel de carbohidratos aceptable",
  });

  // GAP 4: Fibra
  const fiberGap = requirements.fiberOptimal - analysis.consumedFiberPercentage;
  gaps.push({
    nutrient: "fiber",
    nutrientLabel: "Fibra",
    current: analysis.consumedFiberPercentage,
    required: requirements.fiberOptimal,
    gap: fiberGap,
    severity: calculateSeverity(fiberGap),
    recommendation:
      fiberGap > 2
        ? `Incrementar fibra en ${fiberGap.toFixed(1)}% (mejora digestión)`
        : fiberGap < -3
        ? `Reducir fibra en ${Math.abs(fiberGap).toFixed(1)}%`
        : "Nivel de fibra adecuado",
  });

  return gaps;
}

// ============================================
// ALGORITMO 3: GENERADOR DE RECOMENDACIONES
// ============================================

/**
 * Generar recomendaciones de alimentos basadas en gaps nutricionales
 *
 * @param gaps - Array de gaps nutricionales detectados
 * @param availableFoods - Catálogo de alimentos disponibles en el hogar
 * @param pet - Información de la mascota
 * @param dailyGoalGrams - Meta diaria en gramos
 * @returns Array de recomendaciones ordenadas por score
 */
export function generateFoodRecommendations(
  gaps: NutritionalGap[],
  availableFoods: Foods[],
  pet: Pets,
  dailyGoalGrams: number
): FoodRecommendation[] {
  const recommendations: FoodRecommendation[] = [];

  // Filtrar gaps significativos (deficiencias moderadas o críticas)
  const significantGaps = gaps.filter(
    (g) =>
      (g.severity === "critical" || g.severity === "moderate") && g.gap > 0
  );

  if (significantGaps.length === 0) {
    // No hay deficiencias significativas
    return [];
  }

  // Evaluar cada alimento disponible
  for (const food of availableFoods) {
    // Skip si el alimento no es apto para la especie
    const suitableSpecies = food.suitable_for_species;
    if (
      Array.isArray(suitableSpecies) &&
      suitableSpecies.length > 0 &&
      !suitableSpecies.includes(pet.species)
    ) {
      continue;
    }

    const moisture = Number(food.moisture_percentage) || 0;

    // Obtener nutrientes en base seca
    const proteinPct =
      moisture > 20
        ? convertToDryMatterBasis(Number(food.protein_percentage) || 0, moisture)
        : Number(food.protein_percentage) || 0;

    const fatPct =
      moisture > 20
        ? convertToDryMatterBasis(Number(food.fat_percentage) || 0, moisture)
        : Number(food.fat_percentage) || 0;

    const carbsPct =
      moisture > 20
        ? convertToDryMatterBasis(Number(food.carbs_percentage) || 0, moisture)
        : Number(food.carbs_percentage) || 0;

    const fiberPct =
      moisture > 20
        ? convertToDryMatterBasis(Number(food.fiber_percentage) || 0, moisture)
        : Number(food.fiber_percentage) || 0;

    // Calcular score de match con gaps
    let score = 0;
    const matchedGaps: NutritionalGap[] = [];
    const reasoning: string[] = [];

    for (const gap of significantGaps) {
      let nutrientValue = 0;
      const gapValue = gap.gap;

      switch (gap.nutrient) {
        case "protein":
          nutrientValue = proteinPct;
          break;
        case "fat":
          nutrientValue = fatPct;
          break;
        case "carbs":
          nutrientValue = carbsPct;
          break;
        case "fiber":
          nutrientValue = fiberPct;
          break;
      }

      // Si el alimento tiene alto contenido del nutriente deficiente
      if (nutrientValue > gap.required) {
        const matchStrength = Math.min(
          (nutrientValue - gap.required) / gapValue,
          1
        );

        // Score ponderado por severidad
        const severityWeight =
          gap.severity === "critical" ? 30 : gap.severity === "moderate" ? 20 : 10;

        score += severityWeight * matchStrength;

        matchedGaps.push(gap);
        reasoning.push(
          `Alto en ${gap.nutrientLabel} (${nutrientValue.toFixed(1)}%)`
        );
      }
    }

    // Bonus si tiene buena palatabilidad/digestibilidad
    if (food.palatability === "excellent") {
      score += 5;
      reasoning.push("Excelente palatabilidad");
    }
    if (food.digestibility === "excellent") {
      score += 5;
      reasoning.push("Excelente digestibilidad");
    }

    // Solo incluir si tiene score > 0 (cubre al menos un gap)
    if (score > 0 && matchedGaps.length > 0) {
      // Calcular porción sugerida (30% de meta diaria como baseline)
      const suggestedPortionGrams = Math.round(dailyGoalGrams * 0.3);

      recommendations.push({
        food,
        score: Math.min(score, 100),
        matchedGaps,
        suggestedPortionGrams,
        reasoning,
      });
    }
  }

  // Ordenar por score descendente
  recommendations.sort((a, b) => b.score - a.score);

  // Limitar a top 5
  return recommendations.slice(0, 5);
}

// ============================================
// ALGORITMO 4: CÁLCULO DE PORCIONES ÓPTIMAS
// ============================================

/**
 * Calcular porción óptima de un alimento recomendado
 *
 * @param food - Alimento recomendado
 * @param gaps - Gaps nutricionales a cubrir
 * @param dailyGoalGrams - Meta diaria en gramos
 * @param currentDailyIntakeGrams - Consumo actual promedio diario
 * @returns Cantidad de gramos recomendada
 */
export function calculateOptimalPortion(
  food: Foods,
  gaps: NutritionalGap[],
  dailyGoalGrams: number,
  currentDailyIntakeGrams: number
): number {
  // Espacio disponible en la dieta diaria
  const availableGrams = Math.max(dailyGoalGrams - currentDailyIntakeGrams, 0);

  if (availableGrams === 0) {
    // Ya cumple meta, sugerir 10% de meta como suplemento
    return Math.round(dailyGoalGrams * 0.1);
  }

  // Calcular cuántos gramos necesita para cubrir el gap más crítico
  const criticalGap = gaps.find((g) => g.severity === "critical") || gaps[0];

  if (!criticalGap) {
    // Sin gaps críticos, usar 30% de espacio disponible
    return Math.round(availableGrams * 0.3);
  }

  const moisture = Number(food.moisture_percentage) || 0;
  let nutrientPct = 0;

  switch (criticalGap.nutrient) {
    case "protein":
      nutrientPct =
        moisture > 20
          ? convertToDryMatterBasis(
              Number(food.protein_percentage) || 0,
              moisture
            )
          : Number(food.protein_percentage) || 0;
      break;
    case "fat":
      nutrientPct =
        moisture > 20
          ? convertToDryMatterBasis(Number(food.fat_percentage) || 0, moisture)
          : Number(food.fat_percentage) || 0;
      break;
    case "carbs":
      nutrientPct =
        moisture > 20
          ? convertToDryMatterBasis(Number(food.carbs_percentage) || 0, moisture)
          : Number(food.carbs_percentage) || 0;
      break;
    case "fiber":
      nutrientPct =
        moisture > 20
          ? convertToDryMatterBasis(Number(food.fiber_percentage) || 0, moisture)
          : Number(food.fiber_percentage) || 0;
      break;
  }

  if (nutrientPct === 0) {
    // Alimento no tiene info del nutriente
    return Math.round(availableGrams * 0.3);
  }

  // Calcular gramos necesarios para cubrir 50% del gap
  // (no queremos cubrir 100% de golpe, sino gradual)
  const targetGapCoverage = criticalGap.gap * 0.5;
  const gramsNeeded = (targetGapCoverage * currentDailyIntakeGrams) / nutrientPct;

  // Limitar entre 10% y 50% del espacio disponible
  const minPortion = availableGrams * 0.1;
  const maxPortion = availableGrams * 0.5;
  const optimalPortion = Math.max(
    minPortion,
    Math.min(gramsNeeded, maxPortion)
  );

  return Math.round(optimalPortion);
}

// ============================================
// FUNCIÓN PRINCIPAL: GENERAR RECOMENDACIONES COMPLETAS
// ============================================

/**
 * Generar recomendaciones nutricionales completas para una mascota
 *
 * @param feedingHistory - Historial de alimentación con datos nutricionales
 * @param pet - Información de la mascota
 * @param availableFoods - Catálogo de alimentos disponibles
 * @param periodDays - Días del período analizado (default: 7)
 * @returns Resultado completo con análisis, gaps y recomendaciones
 */
export function generateNutritionalRecommendations(
  feedingHistory: Array<{
    amount_eaten_grams: number;
    food: {
      protein_percentage: number | null;
      fat_percentage: number | null;
      carbs_percentage: number | null;
      fiber_percentage: number | null;
      moisture_percentage: number | null;
      calories_per_100g: number | null;
    };
  }>,
  pet: Pets,
  availableFoods: Foods[],
  periodDays: number = 7
): RecommendationResult {
  // 1. Analizar consumo nutricional del período
  const analysis = analyzeNutritionalIntake(feedingHistory, pet, periodDays);

  // 2. Obtener requerimientos de la especie
  const requirements = getSpeciesRequirements(pet.species);

  // 3. Detectar gaps nutricionales
  const gaps = detectNutritionalGaps(analysis, requirements);

  // 4. Generar recomendaciones de alimentos
  const dailyGoalGrams = Number(pet.daily_food_goal_grams) || 100;
  const recommendations = generateFoodRecommendations(
    gaps,
    availableFoods,
    pet,
    dailyGoalGrams
  );

  // 5. Calcular porciones óptimas para cada recomendación
  const currentDailyIntakeGrams =
    analysis.avgDailyProteinGrams +
    analysis.avgDailyFatGrams +
    analysis.avgDailyCarbsGrams +
    analysis.avgDailyFiberGrams || dailyGoalGrams * 0.7; // Estimar 70% si no hay data

  for (const rec of recommendations) {
    rec.suggestedPortionGrams = calculateOptimalPortion(
      rec.food,
      rec.matchedGaps,
      dailyGoalGrams,
      currentDailyIntakeGrams
    );
  }

  return {
    analysis,
    requirements,
    gaps,
    recommendations,
  };
}
