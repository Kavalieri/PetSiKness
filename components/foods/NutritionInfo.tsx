/**
 * NutritionInfo Component
 * Pet SiKness - Visualización Nutricional Profesional
 */

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Flame, Beef, Droplet, Wheat, Apple, Info } from "lucide-react";
import type { Foods } from "@/types/database.generated";
import type { FoodType } from "@/types/foods";
import {
  calculateGrams,
  calculateCaloriesPerServing,
  calculateDrySolids,
  calculateTotalMacros,
  analyzeNutritionalProfile,
  getProteinQuality,
  getFatQuality,
  getFiberQuality,
  MACRO_COLORS,
  type QualityLevel,
} from "@/lib/helpers/nutrition";
import {
  SPECIES_OPTIONS,
  AGE_RANGE_OPTIONS,
} from "@/lib/constants/foods";

// ============================================
// TYPES
// ============================================

interface NutritionInfoProps {
  food: Foods;
  compact?: boolean;
}

interface MacroBarProps {
  icon: React.ReactNode;
  label: string;
  percentage: number;
  grams: number;
  color: keyof typeof MACRO_COLORS;
  quality?: QualityLevel | null;
}

// ============================================
// SUB-COMPONENTS
// ============================================

/**
 * Barra de macronutriente con progress bar y badge de calidad
 */
function MacroBar({
  icon,
  label,
  percentage,
  grams,
  color,
  quality,
}: MacroBarProps) {
  const colors = MACRO_COLORS[color];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`${colors.text}`}>{icon}</div>
          <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{percentage}%</span>
          <span className="text-xs text-muted-foreground">
            ({grams}g/100g)
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <Progress value={percentage} className="flex-1 h-2" />
        {quality && (
          <Badge variant={quality.variant} className="text-xs">
            {quality.label}
          </Badge>
        )}
      </div>

      {/* Quality Description */}
      {quality && (
        <p className="text-xs text-muted-foreground">{quality.description}</p>
      )}
    </div>
  );
}

/**
 * Vista compacta de nutrición para cards
 */
function CompactNutritionView({ food }: { food: Foods }) {
  const calories = Number(food.calories_per_100g) || 0;
  const protein = Number(food.protein_percentage) || 0;
  const fat = Number(food.fat_percentage) || 0;
  const carbs = Number(food.carbs_percentage) || 0;

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      {/* Calorías */}
      {calories > 0 && (
        <div className="flex items-center gap-2">
          <Flame className="h-4 w-4 text-orange-500" />
          <div>
            <div className="font-medium">{calories}</div>
            <div className="text-xs text-muted-foreground">kcal/100g</div>
          </div>
        </div>
      )}

      {/* Proteína */}
      {protein > 0 && (
        <div className="flex items-center gap-2">
          <Beef className="h-4 w-4 text-blue-500" />
          <div>
            <div className="font-medium">{protein}%</div>
            <div className="text-xs text-muted-foreground">Proteína</div>
          </div>
        </div>
      )}

      {/* Grasa */}
      {fat > 0 && (
        <div className="flex items-center gap-2">
          <Droplet className="h-4 w-4 text-yellow-500" />
          <div>
            <div className="font-medium">{fat}%</div>
            <div className="text-xs text-muted-foreground">Grasa</div>
          </div>
        </div>
      )}

      {/* Carbohidratos */}
      {carbs > 0 && (
        <div className="flex items-center gap-2">
          <Wheat className="h-4 w-4 text-green-500" />
          <div>
            <div className="font-medium">{carbs}%</div>
            <div className="text-xs text-muted-foreground">Carbos</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

export function NutritionInfo({ food, compact = false }: NutritionInfoProps) {
  // Conversión de tipos Kysely a primitivos
  const calories = Number(food.calories_per_100g) || 0;
  const protein = Number(food.protein_percentage) || 0;
  const fat = Number(food.fat_percentage) || 0;
  const carbs = Number(food.carbs_percentage) || 0;
  const fiber = Number(food.fiber_percentage) || 0;
  const moisture = Number(food.moisture_percentage) || 0;
  const servingSize = Number(food.serving_size_grams) || 0;
  const foodType = String(food.food_type) as FoodType;

  // Cálculos
  const caloriesPerServing =
    calories > 0 && servingSize > 0
      ? calculateCaloriesPerServing(calories, servingSize)
      : null;

  const drySolids = moisture > 0 ? calculateDrySolids(moisture) : 100;
  const totalMacros = calculateTotalMacros(food);
  const profile = analyzeNutritionalProfile(food);

  // Calidad de macros
  const proteinQuality =
    protein > 0 ? getProteinQuality(protein, foodType) : null;
  const fatQuality = fat > 0 ? getFatQuality(fat) : null;
  const fiberQuality = fiber > 0 ? getFiberQuality(fiber) : null;

  // Vista compacta
  if (compact) {
    return <CompactNutritionView food={food} />;
  }

  // Vista completa
  return (
    <div className="space-y-6">
      {/* Card 1: Calorías */}
      {calories > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Flame className="h-5 w-5 text-orange-500" />
              Energía
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-4xl font-bold text-orange-600">
                {calories}
              </div>
              <div className="text-sm text-muted-foreground">
                kcal por 100g
              </div>
            </div>

            {caloriesPerServing && (
              <div className="pt-4 border-t">
                <div className="text-2xl font-semibold">
                  {caloriesPerServing}
                </div>
                <div className="text-sm text-muted-foreground">
                  kcal por porción ({servingSize}g)
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 2: Macronutrientes */}
      {(protein > 0 || fat > 0 || carbs > 0 || fiber > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Macronutrientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Proteína */}
            {protein > 0 && (
              <MacroBar
                icon={<Beef className="h-4 w-4" />}
                label="Proteína"
                percentage={protein}
                grams={calculateGrams(protein, drySolids)}
                color="protein"
                quality={proteinQuality}
              />
            )}

            {/* Grasa */}
            {fat > 0 && (
              <MacroBar
                icon={<Droplet className="h-4 w-4" />}
                label="Grasa"
                percentage={fat}
                grams={calculateGrams(fat, drySolids)}
                color="fat"
                quality={fatQuality}
              />
            )}

            {/* Carbohidratos */}
            {carbs > 0 && (
              <MacroBar
                icon={<Wheat className="h-4 w-4" />}
                label="Carbohidratos"
                percentage={carbs}
                grams={calculateGrams(carbs, drySolids)}
                color="carbs"
              />
            )}

            {/* Fibra */}
            {fiber > 0 && (
              <MacroBar
                icon={<Apple className="h-4 w-4" />}
                label="Fibra"
                percentage={fiber}
                grams={calculateGrams(fiber, drySolids)}
                color="fiber"
                quality={fiberQuality}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Card 3: Composición */}
      {moisture > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Composición</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Humedad */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Humedad</span>
                <span className="font-medium">{moisture}%</span>
              </div>

              {/* Materia Seca */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Materia Seca
                </span>
                <span className="font-medium">{drySolids}%</span>
              </div>

              {/* Total Macros */}
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-sm text-muted-foreground">
                  Macros Totales
                </span>
                <span
                  className={`font-medium ${
                    totalMacros > 100 ? "text-red-500" : ""
                  }`}
                >
                  {totalMacros}%
                </span>
              </div>

              {/* Alerta si suma > 100% */}
              {totalMacros > 100 && (
                <Alert variant="destructive" className="mt-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    La suma de macronutrientes excede el 100%. Verifica los
                    datos nutricionales.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card 4: Análisis Nutricional */}
      {(profile.highlights.length > 0 ||
        profile.warnings.length > 0 ||
        food.suitable_for_species ||
        food.age_range) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Análisis Nutricional</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-2">
                  Puntuación Nutricional
                </div>
                <Progress value={profile.score} className="h-3" />
              </div>
              <div className="text-2xl font-bold">{profile.score}</div>
            </div>

            {/* Características destacadas */}
            {profile.highlights.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">
                  Características destacadas
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.highlights.map((highlight, idx) => (
                    <Badge key={idx} variant="default">
                      {highlight}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Advertencias */}
            {profile.warnings.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2 text-red-600">
                  Advertencias
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.warnings.map((warning, idx) => (
                    <Badge key={idx} variant="destructive">
                      {warning}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Especies aptas */}
            {food.suitable_for_species &&
              Array.isArray(food.suitable_for_species) &&
              food.suitable_for_species.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">
                    Adecuado para
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(food.suitable_for_species as string[]).map(
                      (species, idx) => {
                        const option = SPECIES_OPTIONS.find(
                          (opt) => opt.value === species
                        );
                        return (
                          <Badge key={idx} variant="outline">
                            {option?.emoji} {option?.label || species}
                          </Badge>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

            {/* Rango de edad */}
            {food.age_range && (
              <div>
                <div className="text-sm font-medium mb-2">Etapa de vida</div>
                <Badge variant="secondary">
                  {AGE_RANGE_OPTIONS.find(
                    (opt) => opt.value === food.age_range
                  )?.label || String(food.age_range)}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
