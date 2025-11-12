/**
 * NutritionalInsights Component
 * Pet SiKness - Panel de análisis nutricional agregado
 */

"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Beef,
  Droplet,
  Wheat,
  Apple,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";
import type {
  NutritionalAnalysis,
  NutritionalRequirements,
  NutritionalGap,
} from "@/lib/algorithms/nutrition-recommendations";
import { formatGrams } from "@/lib/config/chart-theme";

// ============================================
// TYPES
// ============================================

interface NutritionalInsightsProps {
  analysis: NutritionalAnalysis;
  requirements: NutritionalRequirements;
  gaps: NutritionalGap[];
  periodDays?: number;
}

// ============================================
// HELPERS
// ============================================

const getNutrientIcon = (nutrient: string) => {
  switch (nutrient) {
    case "protein":
      return <Beef className="h-5 w-5" />;
    case "fat":
      return <Droplet className="h-5 w-5" />;
    case "carbs":
      return <Wheat className="h-5 w-5" />;
    case "fiber":
      return <Apple className="h-5 w-5" />;
    default:
      return <Info className="h-5 w-5" />;
  }
};

const getNutrientColor = (nutrient: string) => {
  switch (nutrient) {
    case "protein":
      return "text-red-600 dark:text-red-400";
    case "fat":
      return "text-orange-600 dark:text-orange-400";
    case "carbs":
      return "text-yellow-600 dark:text-yellow-400";
    case "fiber":
      return "text-green-600 dark:text-green-400";
    default:
      return "text-gray-600";
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "critical":
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case "moderate":
      return <TrendingDown className="h-4 w-4 text-warning" />;
    case "minor":
      return <Info className="h-4 w-4 text-muted-foreground" />;
    case "ok":
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    case "excess":
      return <TrendingUp className="h-4 w-4 text-orange-500" />;
    default:
      return null;
  }
};

const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case "critical":
      return (
        <Badge variant="destructive" className="text-xs">
          Crítico
        </Badge>
      );
    case "moderate":
      return (
        <Badge variant="secondary" className="text-xs bg-orange-500 text-white">
          Moderado
        </Badge>
      );
    case "minor":
      return (
        <Badge variant="secondary" className="text-xs">
          Leve
        </Badge>
      );
    case "ok":
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          Óptimo
        </Badge>
      );
    case "excess":
      return (
        <Badge variant="outline" className="text-xs">
          Exceso
        </Badge>
      );
    default:
      return null;
  }
};

// ============================================
// COMPONENT
// ============================================

export function NutritionalInsights({
  analysis,
  gaps,
  periodDays = 7,
}: NutritionalInsightsProps) {
  // Calcular summary
  const criticalGaps = gaps.filter((g) => g.severity === "critical");
  const moderateGaps = gaps.filter((g) => g.severity === "moderate");
  const okGaps = gaps.filter((g) => g.severity === "ok");

  const overallStatus =
    criticalGaps.length > 0
      ? "critical"
      : moderateGaps.length > 0
      ? "moderate"
      : "ok";

  return (
    <div className="space-y-4">
      {/* Header con período y status general */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">Análisis Nutricional</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {analysis.petName} • Últimos {periodDays} días •{" "}
                {analysis.species === "cat" ? "🐱 Gato" : "🐶 Perro"}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {overallStatus === "critical" && (
                <>
                  <Badge variant="destructive">Requiere atención</Badge>
                  <span className="text-xs text-muted-foreground">
                    {criticalGaps.length} deficiencia
                    {criticalGaps.length > 1 ? "s" : ""} crítica
                    {criticalGaps.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
              {overallStatus === "moderate" && (
                <>
                  <Badge
                    variant="secondary"
                    className="bg-orange-500 text-white"
                  >
                    Mejorable
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {moderateGaps.length} gap
                    {moderateGaps.length > 1 ? "s" : ""} moderado
                    {moderateGaps.length > 1 ? "s" : ""}
                  </span>
                </>
              )}
              {overallStatus === "ok" && (
                <>
                  <Badge variant="default" className="bg-green-600">
                    Balance óptimo
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {okGaps.length}/{gaps.length} nutrientes OK
                  </span>
                </>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resumen de consumo promedio diario */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Proteína/día</p>
              <p className="text-lg font-bold">
                {formatGrams(analysis.avgDailyProteinGrams)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analysis.consumedProteinPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Grasa/día</p>
              <p className="text-lg font-bold">
                {formatGrams(analysis.avgDailyFatGrams)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analysis.consumedFatPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Carbs/día</p>
              <p className="text-lg font-bold">
                {formatGrams(analysis.avgDailyCarbsGrams)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analysis.consumedCarbsPercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Fibra/día</p>
              <p className="text-lg font-bold">
                {formatGrams(analysis.avgDailyFiberGrams)}
              </p>
              <p className="text-xs text-muted-foreground">
                {analysis.consumedFiberPercentage.toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Alert de especies */}
          {analysis.species === "cat" && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Gatos carnívoros:</strong> Necesitan alta proteína
                (≥40%) y grasa (≥45%), muy baja en carbohidratos (&lt;5% ideal).
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Gaps nutricionales detallados */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Balance vs Requerimientos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {gaps.map((gap) => {
            const progress = Math.min((gap.current / gap.required) * 100, 100);
            const isDeficient = gap.gap > 0;
            const isExcess = gap.gap < 0 && gap.severity === "excess";

            return (
              <div key={gap.nutrient} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={getNutrientColor(gap.nutrient)}>
                      {getNutrientIcon(gap.nutrient)}
                    </span>
                    <span className="font-medium">{gap.nutrientLabel}</span>
                    {getSeverityBadge(gap.severity)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {gap.current.toFixed(1)}% / {gap.required.toFixed(1)}%
                    </span>
                    {getSeverityIcon(gap.severity)}
                  </div>
                </div>

                <Progress
                  value={progress}
                  className={`h-2 ${
                    isDeficient
                      ? "[&>div]:bg-orange-500"
                      : isExcess
                      ? "[&>div]:bg-yellow-500"
                      : "[&>div]:bg-green-600"
                  }`}
                />

                <p className="text-xs text-muted-foreground">
                  {gap.recommendation}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Calorías totales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Energía Consumida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Total período
              </p>
              <p className="text-2xl font-bold">
                {Math.round(analysis.totalCalories)} kcal
              </p>
              <p className="text-xs text-muted-foreground">{periodDays} días</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Promedio diario
              </p>
              <p className="text-2xl font-bold">
                {Math.round(analysis.avgDailyCalories)} kcal
              </p>
              <p className="text-xs text-muted-foreground">por día</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
