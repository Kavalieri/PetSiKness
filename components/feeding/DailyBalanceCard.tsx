"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingDown, TrendingUp, Check, AlertTriangle } from "lucide-react";

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
// COMPONENTE PRINCIPAL
// ============================================

export function DailyBalanceCard({
  data,
  compact = false,
}: DailyBalanceCardProps) {
  const config = statusConfig[data.status];
  const Icon = config.icon;

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
    <div
      className={`grid gap-4 ${
        compact
          ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          : "grid-cols-1 lg:grid-cols-2"
      }`}
    >
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
