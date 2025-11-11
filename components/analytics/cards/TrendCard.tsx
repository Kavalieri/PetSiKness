"use client";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, CHART_DEFAULTS } from "@/lib/config/chart-theme";

// ============================================
// TYPES
// ============================================

type TrendDirection = "up" | "down" | "neutral";

interface DataPoint {
  /**
   * Label del punto (fecha, hora, etc.)
   */
  label: string;

  /**
   * Valor numérico
   */
  value: number;
}

interface TrendCardProps {
  /**
   * Título de la métrica
   */
  title: string;

  /**
   * Valor principal actual
   */
  value: string | number;

  /**
   * Datos de tendencia (últimos N días)
   */
  data: DataPoint[];

  /**
   * Cambio % vs período anterior
   */
  change?: number;

  /**
   * Dirección de la tendencia
   */
  trend?: TrendDirection;

  /**
   * Color del gráfico
   * @default CHART_COLORS.primary
   */
  color?: string;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Si true, muestra eje X
   * @default false
   */
  showAxis?: boolean;
}

// ============================================
// HELPERS
// ============================================

function getTrendColor(trend: TrendDirection): string {
  const colors = {
    up: "text-success",
    down: "text-danger",
    neutral: "text-muted-foreground",
  };

  return colors[trend];
}

// ============================================
// COMPONENT
// ============================================

/**
 * Card con métrica + sparkline
 *
 * Combina:
 * - Valor principal destacado
 * - Cambio % vs período anterior
 * - Mini gráfico de área (sparkline)
 * - Indicador de tendencia
 *
 * @example
 * ```tsx
 * <TrendCard
 *   title="Consumo Semanal"
 *   value="3.2kg"
 *   change={12.5}
 *   trend="up"
 *   data={[
 *     { label: "Lun", value: 450 },
 *     { label: "Mar", value: 480 },
 *     ...
 *   ]}
 * />
 * ```
 */
export function TrendCard({
  title,
  value,
  data,
  change,
  trend = "neutral",
  color = CHART_COLORS.primary,
  className,
  showAxis = false,
}: TrendCardProps) {
  const trendColor = getTrendColor(trend);

  return (
    <Card className={cn("w-full", className)}>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Header: Título + Valor */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold tracking-tight">{value}</p>
              {change !== undefined && (
                <span className={cn("text-sm font-medium", trendColor)}>
                  {change > 0 ? "+" : ""}
                  {change.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Sparkline */}
          <div className="h-16 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              >
                {showAxis && (
                  <>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis hide />
                  </>
                )}
                <Tooltip
                  contentStyle={CHART_DEFAULTS.tooltip.contentStyle}
                  cursor={CHART_DEFAULTS.tooltip.cursor}
                  formatter={(value: number) => [`${value}`, "Valor"]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  fill={color}
                  fillOpacity={0.2}
                  strokeWidth={CHART_DEFAULTS.strokeWidth}
                  animationDuration={CHART_DEFAULTS.animationDuration}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
