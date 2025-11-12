/**
 * RecommendationCard Component
 * Pet SiKness - Tarjeta de recomendación de alimento
 */

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Beef,
  Droplet,
  Wheat,
  Apple,
  TrendingUp,
  Info,
  Plus,
} from "lucide-react";
import type { FoodRecommendation } from "@/lib/algorithms/nutrition-recommendations";
import { formatGrams } from "@/lib/config/chart-theme";
import { getPhotoDisplay } from "@/lib/constants/food-icons";
import type { FoodType } from "@/types/foods";

// ============================================
// TYPES
// ============================================

interface RecommendationCardProps {
  recommendation: FoodRecommendation;
  onAddToFeeding?: () => void;
  showDetails?: boolean;
}

// ============================================
// HELPERS
// ============================================

const getNutrientIcon = (nutrient: string) => {
  switch (nutrient) {
    case "protein":
      return <Beef className="h-4 w-4" />;
    case "fat":
      return <Droplet className="h-4 w-4" />;
    case "carbs":
      return <Wheat className="h-4 w-4" />;
    case "fiber":
      return <Apple className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "destructive";
    case "moderate":
      return "warning";
    case "minor":
      return "secondary";
    default:
      return "outline";
  }
};

// ============================================
// COMPONENT
// ============================================

export function RecommendationCard({
  recommendation,
  onAddToFeeding,
  showDetails = true,
}: RecommendationCardProps) {
  const { food, score, matchedGaps, suggestedPortionGrams, reasoning } =
    recommendation;

  const foodIcon = getPhotoDisplay(null, food.food_type as FoodType);

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          {/* Food info */}
          <div className="flex items-start gap-3 flex-1">
            <div className="text-3xl">{foodIcon}</div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base mb-1 truncate">
                {food.name}
              </CardTitle>
              {food.brand && (
                <p className="text-sm text-muted-foreground truncate">
                  {food.brand}
                </p>
              )}
              <Badge variant="outline" className="mt-2">
                {food.food_type}
              </Badge>
            </div>
          </div>

          {/* Match score */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">
                {Math.round(score)}%
              </span>
            </div>
            <span className="text-xs text-muted-foreground">Match</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Suggested portion */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium">Porción sugerida</span>
            <span className="text-lg font-bold text-primary">
              {formatGrams(suggestedPortionGrams)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cantidad recomendada para cubrir deficiencias gradualmente
          </p>
        </div>

        {/* Matched gaps */}
        {showDetails && matchedGaps.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Nutrientes que cubre
            </h4>
            <div className="space-y-2">
              {matchedGaps.map((gap, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    {getNutrientIcon(gap.nutrient)}
                    <span>{gap.nutrientLabel}</span>
                    <Badge
                      variant={getSeverityColor(gap.severity) as any}
                      className="text-xs"
                    >
                      {gap.severity === "critical"
                        ? "Crítico"
                        : gap.severity === "moderate"
                        ? "Moderado"
                        : "Leve"}
                    </Badge>
                  </div>
                  <span className="text-muted-foreground">
                    {gap.current.toFixed(1)}% → {gap.required.toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reasoning */}
        {showDetails && reasoning.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">¿Por qué este alimento?</h4>
            <ul className="space-y-1">
              {reasoning.map((reason, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Score progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Puntuación de idoneidad
            </span>
            <span className="text-xs font-medium">{Math.round(score)}/100</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        {/* Action button */}
        {onAddToFeeding && (
          <Button onClick={onAddToFeeding} className="w-full" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Agregar a alimentación
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
