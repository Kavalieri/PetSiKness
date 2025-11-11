"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Edit,
  Clock,
  UtensilsCrossed,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================

interface FeedingData {
  id: string;
  pet_id: string;
  pet_name: string;
  food_id: string;
  food_name: string;
  food_brand: string | null;
  feeding_date: string;
  feeding_time: string | null;
  meal_number: number | null;
  amount_served_grams: number;
  amount_eaten_grams: number;
  amount_leftover_grams: number | null;
  appetite_rating: string | null;
  eating_speed: string | null;
  vomited: boolean | null;
  had_diarrhea: boolean | null;
  stool_quality: string | null;
  notes?: string | null;
}

interface MealGroupCardProps {
  mealNumber: number;
  feedings: FeedingData[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// ============================================
// CONFIGURACIÓN
// ============================================

const appetiteConfig = {
  refused: { label: "Rechazado", variant: "destructive" as const },
  poor: { label: "Pobre", variant: "secondary" as const },
  normal: { label: "Normal", variant: "default" as const },
  good: { label: "Bueno", variant: "default" as const },
  excellent: { label: "Excelente", variant: "default" as const },
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function MealGroupCard({
  mealNumber,
  feedings,
  onEdit,
  onDelete,
}: MealGroupCardProps) {
  // Obtener datos de la toma (asumiendo mismo alimento y hora)
  const firstFeeding = feedings[0];
  const feedingTime = firstFeeding.feeding_time
    ? firstFeeding.feeding_time.slice(0, 5)
    : "Sin hora";

  // Calcular totales
  const totalServed = feedings.reduce(
    (sum, f) => sum + f.amount_served_grams,
    0
  );
  const totalEaten = feedings.reduce((sum, f) => sum + f.amount_eaten_grams, 0);
  const totalLeftover = feedings.reduce(
    (sum, f) => sum + (f.amount_leftover_grams || 0),
    0
  );

  // Determinar estado general
  const avgPercentage = (totalEaten / totalServed) * 100;
  let statusIcon;
  let statusColor;
  let statusLabel;

  if (avgPercentage >= 90) {
    statusIcon = <CheckCircle2 className="h-5 w-5 text-green-600" />;
    statusColor = "text-green-700";
    statusLabel = "Completado";
  } else if (avgPercentage >= 70) {
    statusIcon = <TrendingDown className="h-5 w-5 text-yellow-600" />;
    statusColor = "text-yellow-700";
    statusLabel = "Parcial";
  } else {
    statusIcon = <TrendingDown className="h-5 w-5 text-red-600" />;
    statusColor = "text-red-700";
    statusLabel = "Bajo";
  }

  // Detectar alertas de salud
  const hasHealthAlerts = feedings.some(
    (f) => f.vomited || f.had_diarrhea || f.stool_quality
  );

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          {/* Información de la toma */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-muted-foreground" />
              <CardTitle className="text-xl">Toma #{mealNumber}</CardTitle>
              <Badge variant="outline" className="ml-2">
                {feedings.length}{" "}
                {feedings.length === 1 ? "mascota" : "mascotas"}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {feedingTime}
              <span className="mx-2">•</span>
              {firstFeeding.food_brand && `${firstFeeding.food_brand} - `}
              {firstFeeding.food_name}
            </CardDescription>
          </div>

          {/* Estado general */}
          <div className="flex items-center gap-3 shrink-0">
            {statusIcon}
            <div className="text-right">
              <p className={`font-bold text-lg ${statusColor}`}>
                {avgPercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-muted-foreground">{statusLabel}</p>
            </div>
          </div>
        </div>

        {/* Totales */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Servido</p>
            <p className="font-semibold text-sm">{totalServed}g</p>
          </div>
          <div className="text-center p-2 bg-primary/10 rounded-md">
            <p className="text-xs text-muted-foreground">Comido</p>
            <p className="font-semibold text-sm">{totalEaten}g</p>
          </div>
          <div className="text-center p-2 bg-muted rounded-md">
            <p className="text-xs text-muted-foreground">Sobra</p>
            <p className="font-semibold text-sm">{totalLeftover}g</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Lista de mascotas */}
        <div className="space-y-3">
          {feedings.map((feeding) => {
            const eatenPct =
              (feeding.amount_eaten_grams / feeding.amount_served_grams) * 100;

            return (
              <div
                key={feeding.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {/* Info de la mascota */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{feeding.pet_name}</p>
                    {feeding.appetite_rating &&
                      appetiteConfig[
                        feeding.appetite_rating as keyof typeof appetiteConfig
                      ] && (
                        <Badge
                          variant={
                            appetiteConfig[
                              feeding.appetite_rating as keyof typeof appetiteConfig
                            ].variant
                          }
                          className="text-xs"
                        >
                          {
                            appetiteConfig[
                              feeding.appetite_rating as keyof typeof appetiteConfig
                            ].label
                          }
                        </Badge>
                      )}
                    {(feeding.vomited || feeding.had_diarrhea) && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>

                  {/* Cantidades individuales */}
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">
                      {feeding.amount_eaten_grams}g /{" "}
                      {feeding.amount_served_grams}g
                    </span>
                    <span
                      className={`font-semibold ${
                        eatenPct >= 90
                          ? "text-green-600"
                          : eatenPct >= 70
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {eatenPct.toFixed(0)}%
                    </span>
                    {feeding.amount_leftover_grams !== null &&
                      feeding.amount_leftover_grams > 0 && (
                        <span className="text-xs text-muted-foreground">
                          (sobra: {feeding.amount_leftover_grams}g)
                        </span>
                      )}
                  </div>

                  {/* Notas */}
                  {feeding.notes && (
                    <p className="text-xs text-muted-foreground italic">
                      {feeding.notes}
                    </p>
                  )}
                </div>

                {/* Acciones */}
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(feeding.id)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(feeding.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Alertas de salud agregadas */}
        {hasHealthAlerts && (
          <div className="mt-3 p-3 border-l-4 border-destructive bg-destructive/5 rounded">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-1">
              <AlertTriangle className="h-4 w-4" />
              Alertas de salud detectadas
            </div>
            <ul className="text-xs space-y-1">
              {feedings
                .filter((f) => f.vomited || f.had_diarrhea || f.stool_quality)
                .map((f) => (
                  <li key={f.id}>
                    <span className="font-medium">{f.pet_name}:</span>
                    {f.vomited && " Vómito"}
                    {f.had_diarrhea && " Diarrea"}
                    {f.stool_quality && ` Heces: ${f.stool_quality}`}
                  </li>
                ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
