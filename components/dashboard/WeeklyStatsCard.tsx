/**
 * Weekly Stats Card Component
 * Muestra estadísticas semanales con contexto de días con datos
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Calendar, CheckCircle2 } from "lucide-react";

// ============================================
// TIPOS
// ============================================

interface WeeklyStatsData {
  date: string;
  total_eaten: number;
  avg_achievement_pct: number;
  days_on_track: number;
  days_with_data: number;
  total_days: number;
}

interface WeeklyStatsCardProps {
  stats: WeeklyStatsData[];
  petName?: string; // Opcional: para stats específicas de una mascota
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Agrega estadísticas de toda la semana
 */
function aggregateWeeklyStats(stats: WeeklyStatsData[]) {
  if (stats.length === 0) {
    return {
      totalEaten: 0,
      avgAchievement: 0,
      daysOnTrack: 0,
      daysWithData: 0,
      totalDays: 7,
    };
  }

  const totalEaten = stats.reduce((sum, day) => sum + day.total_eaten, 0);
  
  // ✨ FIXED: Calcular promedio solo de días con datos
  const daysWithData = stats.filter(day => day.days_with_data > 0);
  const avgAchievement = daysWithData.length > 0
    ? daysWithData.reduce((sum, day) => sum + day.avg_achievement_pct, 0) / daysWithData.length
    : 0;

  const daysOnTrack = stats.reduce((sum, day) => sum + day.days_on_track, 0);
  const totalDaysWithData = stats.reduce((sum, day) => sum + day.days_with_data, 0);

  return {
    totalEaten,
    avgAchievement,
    daysOnTrack,
    daysWithData: totalDaysWithData,
    totalDays: 7,
  };
}

/**
 * Determina el color del badge según el porcentaje de cumplimiento
 */
function getAchievementColor(pct: number): "default" | "destructive" | "secondary" {
  if (pct < 80) return "destructive";
  if (pct >= 90 && pct <= 110) return "default";
  return "secondary";
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function WeeklyStatsCard({ stats, petName }: WeeklyStatsCardProps) {
  const aggregated = aggregateWeeklyStats(stats);
  const achievementColor = getAchievementColor(aggregated.avgAchievement);

  // Determinar si hay suficientes datos para mostrar estadísticas confiables
  const hasReliableData = aggregated.daysWithData >= 3;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            {petName ? `Tendencia Semanal - ${petName}` : "Tendencia Semanal"}
          </CardTitle>
          <Badge variant={achievementColor}>
            {aggregated.avgAchievement.toFixed(1)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contexto de datos disponibles */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            {aggregated.daysWithData} de {aggregated.totalDays} días con registros
          </span>
        </div>

        {/* Advertencia si hay pocos datos */}
        {!hasReliableData && aggregated.daysWithData > 0 && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              ⚠️ Pocos datos disponibles. Las estadísticas pueden no ser representativas.
            </p>
          </div>
        )}

        {/* Sin datos */}
        {aggregated.daysWithData === 0 && (
          <div className="p-6 text-center text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay registros en los últimos 7 días</p>
          </div>
        )}

        {/* Estadísticas (solo si hay datos) */}
        {aggregated.daysWithData > 0 && (
          <>
            {/* Promedio de cumplimiento */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Promedio de cumplimiento
                </span>
                <span className="font-semibold">
                  {aggregated.avgAchievement.toFixed(1)}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Calculado sobre {aggregated.daysWithData}{" "}
                {aggregated.daysWithData === 1 ? "día" : "días"} con datos
              </p>
            </div>

            {/* Total comido */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Total consumido</span>
              </div>
              <span className="text-lg font-bold">{aggregated.totalEaten}g</span>
            </div>

            {/* Días en objetivo */}
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium">Días en objetivo</span>
              </div>
              <span className="text-lg font-bold">
                {aggregated.daysOnTrack}/{aggregated.daysWithData}
              </span>
            </div>

            {/* Porcentaje de días en objetivo */}
            {aggregated.daysWithData > 0 && (
              <div className="pt-2 border-t text-center">
                <p className="text-xs text-muted-foreground">
                  {((aggregated.daysOnTrack / aggregated.daysWithData) * 100).toFixed(0)}%
                  de los días cumplieron el objetivo
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE PARA LISTA DE MASCOTAS
// ============================================

interface WeeklyStatsListProps {
  statsByPet: Array<{
    petName: string;
    stats: WeeklyStatsData[];
  }>;
}

/**
 * Lista de cards de tendencia semanal, una por mascota
 */
export function WeeklyStatsList({ statsByPet }: WeeklyStatsListProps) {
  if (statsByPet.length === 0) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No hay estadísticas disponibles</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {statsByPet.map(({ petName, stats }) => (
        <WeeklyStatsCard key={petName} stats={stats} petName={petName} />
      ))}
    </div>
  );
}
