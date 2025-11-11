"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

// ============================================
// TYPES
// ============================================

type TrendDirection = "up" | "down" | "neutral";

interface MetricCardProps {
  /**
   * Título de la métrica
   */
  title: string;

  /**
   * Valor principal de la métrica
   */
  value: string | number;

  /**
   * Cambio respecto al período anterior (%)
   */
  change?: number;

  /**
   * Dirección de la tendencia
   */
  trend?: TrendDirection;

  /**
   * Ícono opcional
   */
  icon?: React.ReactNode;

  /**
   * Descripción adicional
   */
  description?: string;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Si true, el cambio es positivo cuando disminuye (ej: sobras)
   * @default false
   */
  invertedChange?: boolean;
}

// ============================================
// HELPERS
// ============================================

function getTrendIcon(trend: TrendDirection) {
  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const Icon = icons[trend];
  return <Icon className="h-4 w-4" />;
}

function getTrendColor(
  trend: TrendDirection,
  inverted: boolean = false
): string {
  if (trend === "neutral") return "text-muted-foreground";

  const isPositive = inverted ? trend === "down" : trend === "up";
  return isPositive ? "text-success" : "text-danger";
}

// ============================================
// COMPONENT
// ============================================

/**
 * Card para mostrar métricas clave
 *
 * Muestra:
 * - Título de la métrica
 * - Valor principal destacado
 * - Cambio % vs período anterior
 * - Indicador de tendencia (up/down/neutral)
 * - Ícono opcional
 *
 * @example
 * ```tsx
 * <MetricCard
 *   title="Consumo Diario"
 *   value="450g"
 *   change={5.2}
 *   trend="up"
 *   icon={<TrendingUp />}
 *   description="vs ayer"
 * />
 * ```
 */
export function MetricCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  description,
  className,
  invertedChange = false,
}: MetricCardProps) {
  const trendColor = getTrendColor(trend, invertedChange);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* Título */}
            <p className="text-sm font-medium text-muted-foreground">{title}</p>

            {/* Valor principal */}
            <p className="text-2xl font-bold tracking-tight">{value}</p>

            {/* Cambio y descripción */}
            {(change !== undefined || description) && (
              <div className="flex items-center gap-2 text-sm">
                {change !== undefined && (
                  <span
                    className={cn(
                      "flex items-center gap-1 font-medium",
                      trendColor
                    )}
                  >
                    {getTrendIcon(trend)}
                    {Math.abs(change).toFixed(1)}%
                  </span>
                )}
                {description && (
                  <span className="text-muted-foreground">{description}</span>
                )}
              </div>
            )}
          </div>

          {/* Ícono */}
          {icon && (
            <div className="rounded-full bg-primary/10 p-2 text-primary">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
