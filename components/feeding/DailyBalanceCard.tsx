"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingDown,
  TrendingUp,
  Check,
  AlertTriangle,
} from "lucide-react";
import { getMealName } from "@/lib/utils/meal-schedule";
import {
  getStatusIcon,
  getStatusLabel,
  getStatusColor,
  type MealBalance,
} from "@/lib/utils/meal-balance";

// ============================================
// TIPOS
// ============================================

interface DailyBalanceData {
  pet_id: string;
  pet_name: string;
  total_served: number;
  total_eaten: number;
  total_leftover: number;
  daily_goal: number;
  achievement_pct: number;
  status: "under" | "met" | "over";
  meal_balances?: MealBalance[]; // ✨ NUEVO: Balances por toma
}

interface DailyBalanceCardProps {
  data: DailyBalanceData;
  compact?: boolean;
}

interface DailyBalanceListProps {
  balances: DailyBalanceData[];
  compact?: boolean;
}

// ============================================
// MAPEOS DE ESTADO
// ============================================

const statusConfig = {
  under: {
    color: "destructive" as const,
    icon: TrendingDown,
    label: "🔴 Bajo objetivo",
    progressColor: "bg-red-500",
    alertVariant: "destructive" as const,
    alertMessage: "Necesita más alimentación para cumplir el objetivo diario.",
  },
  met: {
    color: "default" as const,
    icon: Check,
    label: "🟢 Cumplido",
    progressColor: "bg-green-500",
    alertVariant: "default" as const,
    alertMessage: "¡Perfecto! Ha cumplido su objetivo diario de alimentación.",
  },
  over: {
    color: "secondary" as const,
    icon: TrendingUp,
    label: "🟡 Sobre objetivo",
    progressColor: "bg-yellow-500",
    alertVariant: "default" as const,
    alertMessage:
      "Ha superado el objetivo diario. Monitorear peso y condición corporal.",
  },
};

// ============================================
// COMPONENTES NUEVOS - BALANCE POR TOMA
// ============================================

/**
 * Card individual de una toma
 */
function MealCard({ balance }: { balance: MealBalance }) {
  const statusIcon = getStatusIcon(balance.status);
  const statusLabel = getStatusLabel(balance.status);
  const statusColorClass = getStatusColor(balance.status);

  // Valores base (con fallback a 0)
  const servedGrams = balance.served_grams || 0;
  const eatenGrams = balance.eaten_grams || 0;
  const leftoverGrams = balance.leftover_grams || 0;
  const expectedGrams = balance.expected_grams || 0;

  // 📊 MÉTRICAS CRUZADAS ÚTILES
  
  // 1. Consumo Real: Comido/Servido (% de aprovechamiento)
  const consumptionRate = servedGrams > 0 
    ? Math.round((eatenGrams / servedGrams) * 100) 
    : 0;
  
  // 2. Cumplimiento de Meta: Servido/Esperado (% de meta)
  const goalAchievement = expectedGrams > 0 
    ? Math.round((servedGrams / expectedGrams) * 100) 
    : 0;
  
  // 3. Balance Real: Comido vs Esperado (para evaluar si comió lo suficiente)
  const actualIntake = expectedGrams > 0 
    ? Math.round((eatenGrams / expectedGrams) * 100) 
    : 0;
  
  // 4. Desperdicio: Sobra como % de lo servido
  const wasteRate = servedGrams > 0 
    ? Math.round((leftoverGrams / servedGrams) * 100) 
    : 0;

  return (
    <div className="p-4 border rounded-lg bg-card hover:shadow-md transition-shadow">
      {/* Header: Nombre + Hora + Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold">
            {getMealName(balance.meal_number)}
          </span>
          <span className="text-sm text-muted-foreground">
            {balance.actual_time || balance.scheduled_time}
            {balance.actual_time &&
              balance.actual_time !== balance.scheduled_time && (
                <span className="ml-1 text-xs opacity-60">
                  (prog. {balance.scheduled_time})
                </span>
              )}
          </span>
        </div>
        <Badge className={statusColorClass} variant="outline">
          {statusIcon} {statusLabel}
        </Badge>
      </div>

      {/* Layout horizontal: Cantidades + Métricas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Columna 1: CANTIDADES ABSOLUTAS */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Cantidades
          </h4>
          
          {/* Esperado (baseline) */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <span className="text-sm">🎯 Esperado</span>
            <span className="font-semibold text-base">{expectedGrams}g</span>
          </div>
          
          {/* Servido */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <span className="text-sm">📥 Servido</span>
            <div className="text-right">
              <span className="font-semibold text-base">{servedGrams}g</span>
              <span className={`ml-2 text-xs ${
                goalAchievement >= 90 ? 'text-green-600' : 
                goalAchievement >= 70 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                ({goalAchievement}%)
              </span>
            </div>
          </div>
          
          {/* Comido */}
          <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
            <span className="text-sm">🍽️ Comido</span>
            <div className="text-right">
              <span className="font-semibold text-base">{eatenGrams}g</span>
              <span className={`ml-2 text-xs ${
                actualIntake >= 90 ? 'text-green-600' : 
                actualIntake >= 70 ? 'text-yellow-600' : 
                'text-red-600'
              }`}>
                ({actualIntake}%)
              </span>
            </div>
          </div>
          
          {/* Sobrante (solo si hay) */}
          {leftoverGrams > 0 && (
            <div className="flex items-center justify-between p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded">
              <span className="text-sm">⚠️ Sobra</span>
              <div className="text-right">
                <span className="font-semibold text-base text-yellow-700 dark:text-yellow-500">
                  {leftoverGrams}g
                </span>
                <span className="ml-2 text-xs text-yellow-600">
                  ({wasteRate}%)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Columna 2: MÉTRICAS CRUZADAS */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Análisis
          </h4>
          
          {/* Métrica 1: Cumplimiento de Meta */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Cumplimiento Meta</span>
              <span className="font-bold">{goalAchievement}%</span>
            </div>
            <Progress value={Math.min(goalAchievement, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Servido vs Esperado ({servedGrams}g / {expectedGrams}g)
            </p>
          </div>
          
          {/* Métrica 2: Tasa de Consumo */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Tasa Consumo</span>
              <span className="font-bold">{consumptionRate}%</span>
            </div>
            <Progress value={Math.min(consumptionRate, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Comido vs Servido ({eatenGrams}g / {servedGrams}g)
            </p>
          </div>
          
          {/* Métrica 3: Ingesta Real */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Ingesta Real</span>
              <span className="font-bold">{actualIntake}%</span>
            </div>
            <Progress value={Math.min(actualIntake, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Comido vs Esperado ({eatenGrams}g / {expectedGrams}g)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Versión compacta: lista de tomas + resumen
 */
function MealBasedBalanceCompact({ data }: { data: DailyBalanceData }) {
  if (!data.meal_balances || data.meal_balances.length === 0) return null;

  const completedMeals = data.meal_balances.filter(
    (m) => m.status === "completed"
  ).length;
  const totalMeals = data.meal_balances.length;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">{data.pet_name}</h3>
            <span className="text-sm text-muted-foreground">
              {completedMeals}/{totalMeals} completadas
            </span>
          </div>

          {/* Lista de tomas (mini cards) */}
          <div className="space-y-2">
            {data.meal_balances.map((balance) => (
              <div
                key={balance.meal_number}
                className="flex flex-col p-2 bg-muted/50 rounded text-xs gap-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>{getStatusIcon(balance.status)}</span>
                    <span className="font-medium">
                      {getMealName(balance.meal_number)}
                    </span>
                    <span className="text-muted-foreground">
                      {/* ✨ Mostrar hora real si existe */}
                      {balance.actual_time || balance.scheduled_time}
                    </span>
                  </div>
                  <span className="font-semibold">
                    {/* ✨ CAMBIO: Mostrar servido vs esperado */}
                    {balance.served_grams}g/{balance.expected_grams}g
                  </span>
                </div>
                {/* ✨ NUEVO: Mostrar comido y sobra en segunda línea */}
                <div className="flex justify-between pl-6 text-[10px] text-muted-foreground">
                  <span>Comido: {balance.eaten_grams}g</span>
                  <span>Sobra: {balance.leftover_grams}g</span>
                </div>
              </div>
            ))}
          </div>

          {/* Resumen total */}
          <div className="pt-2 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total del día</span>
              <span className="font-semibold">
                {data.total_eaten}g / {data.daily_goal}g
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Versión completa: cards expandidos por toma + resumen
 */
function MealBasedBalanceFull({ data }: { data: DailyBalanceData }) {
  if (!data.meal_balances || data.meal_balances.length === 0) return null;

  const completedMeals = data.meal_balances.filter(
    (m) => m.status === "completed"
  ).length;
  const delayedMeals = data.meal_balances.filter(
    (m) => m.status === "delayed"
  ).length;
  const totalMeals = data.meal_balances.length;

  // Determinar badge general
  const config = statusConfig[data.status];
  const Icon = config.icon;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{data.pet_name}</CardTitle>
          <Badge variant={config.color} className="text-sm">
            <Icon className="h-4 w-4 mr-1" />
            {completedMeals}/{totalMeals} tomas
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Meal cards horizontales full-width */}
        <div className="flex flex-col gap-3">
          {data.meal_balances.map((balance) => (
            <MealCard key={balance.meal_number} balance={balance} />
          ))}
        </div>

        {/* Resumen general */}
        <div className="p-4 bg-muted/50 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progreso del día</span>
            <span className="text-xl font-bold">
              {data.achievement_pct.toFixed(1)}%
            </span>
          </div>

          {/* ✨ CAMBIO: Mostrar servido, comido y sobra */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-muted-foreground">Servido</p>
              <p className="font-bold text-primary">{data.total_served}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Meta</p>
              <p className="font-bold">{data.daily_goal}g</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sobra</p>
              <p className="font-bold text-yellow-600">
                {data.total_leftover}g
              </p>
            </div>
          </div>

          {/* ✨ NUEVO: Fila adicional con comido */}
          <div className="text-center text-xs text-muted-foreground pt-2 border-t">
            Comido real:{" "}
            <span className="font-semibold text-foreground">
              {data.total_eaten}g
            </span>{" "}
            ({((data.total_eaten / data.total_served) * 100).toFixed(0)}% de lo
            servido)
          </div>
        </div>

        {/* Alerta si hay retrasos */}
        {delayedMeals > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {delayedMeals === 1
                ? "Hay 1 toma retrasada"
                : `Hay ${delayedMeals} tomas retrasadas`}
              . Considera alimentar a {data.pet_name} pronto.
            </AlertDescription>
          </Alert>
        )}

        {/* Alerta de cumplimiento */}
        {delayedMeals === 0 && completedMeals === totalMeals && (
          <Alert>
            <Check className="h-4 w-4" />
            <AlertDescription>
              ¡Excelente! Todas las tomas del día han sido completadas.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function DailyBalanceCard({
  data,
  compact = false,
}: DailyBalanceCardProps) {
  const config = statusConfig[data.status];
  const Icon = config.icon;

  // ✨ NUEVO: Si tenemos balances por toma, mostrar diseño nuevo
  if (data.meal_balances && data.meal_balances.length > 0) {
    return compact ? (
      <MealBasedBalanceCompact data={data} />
    ) : (
      <MealBasedBalanceFull data={data} />
    );
  }

  // ⚠️ LEGACY: Si no hay meal_balances, mostrar diseño antiguo
  // Calcular porcentaje para progress bar (cap at 100)
  const progressValue = Math.min(100, data.achievement_pct);

  if (compact) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {/* Header compacto */}
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{data.pet_name}</h3>
              <Badge variant={config.color}>
                <Icon className="h-3 w-3 mr-1" />
                {config.label}
              </Badge>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progreso</span>
                <span className="font-semibold">
                  {data.achievement_pct.toFixed(1)}%
                </span>
              </div>
              <Progress value={progressValue} className="h-2" />
            </div>

            {/* Stats compactas */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Comido</p>
                <p className="font-semibold">{data.total_eaten}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Meta</p>
                <p className="font-semibold">{data.daily_goal}g</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sobra</p>
                <p className="font-semibold">{data.total_leftover}g</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{data.pet_name}</CardTitle>
          <Badge variant={config.color} className="text-sm">
            <Icon className="h-4 w-4 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress bar principal */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Progreso del día</span>
            <span className="text-2xl font-bold">
              {data.achievement_pct.toFixed(1)}%
            </span>
          </div>
          <Progress value={progressValue} className="h-3" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>Meta: 100%</span>
            <span>150%</span>
          </div>
        </div>

        {/* Estadísticas detalladas */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Servido</p>
            <p className="text-xl font-bold">{data.total_served}g</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Comido</p>
            <p className="text-xl font-bold text-primary">
              {data.total_eaten}g
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-1">Sobra</p>
            <p className="text-xl font-bold">{data.total_leftover}g</p>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium">Meta diaria</span>
          <span className="text-lg font-bold">{data.daily_goal}g</span>
        </div>

        {/* Alerta contextual */}
        <Alert variant={config.alertVariant}>
          <Icon className="h-4 w-4" />
          <AlertDescription>{config.alertMessage}</AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE LISTA
// ============================================

export function DailyBalanceList({
  balances,
  compact = false,
}: DailyBalanceListProps) {
  if (balances.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            Sin datos de alimentación
          </h3>
          <p className="text-muted-foreground">
            No hay registros de alimentación para hoy. <br />
            Registra la primera comida para ver el balance.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {balances.map((balance) => (
        <DailyBalanceCard
          key={balance.pet_id}
          data={balance}
          compact={compact}
        />
      ))}
    </div>
  );
}
