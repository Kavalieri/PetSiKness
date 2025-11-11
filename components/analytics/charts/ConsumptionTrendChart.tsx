"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "../base/ChartContainer";
import { ChartTooltip } from "../base/ChartTooltip";
import { ChartLegend } from "../base/ChartLegend";
import {
  CHART_COLORS,
  CHART_DEFAULTS,
  formatGrams,
} from "@/lib/config/chart-theme";
import {
  getDailyConsumptionTrend,
  type DailyConsumptionData,
} from "@/lib/actions/analytics-data";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ============================================
// TYPES
// ============================================

interface ConsumptionTrendChartProps {
  /**
   * ID de la mascota (opcional - si no se especifica muestra todas)
   */
  petId?: string;

  /**
   * Número de días a mostrar
   * @default 7
   */
  days?: number;

  /**
   * Height del gráfico
   * @default "350px"
   */
  height?: string | number;

  /**
   * Título personalizado
   */
  title?: string;

  /**
   * Descripción personalizada
   */
  description?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Gráfico de líneas con tendencia de consumo diario
 *
 * Muestra:
 * - Cantidad servida vs meta diaria
 * - Cantidad comida (tracking real)
 * - Sobrantes
 *
 * @example
 * ```tsx
 * <ConsumptionTrendChart petId="pet-123" days={7} />
 * ```
 */
export function ConsumptionTrendChart({
  petId,
  days = 7,
  height = "350px",
  title = "Tendencia de Consumo",
  description = "Últimos 7 días",
}: ConsumptionTrendChartProps) {
  const [data, setData] = useState<DailyConsumptionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getDailyConsumptionTrend(petId, days);

      if (result.ok) {
        setData(result.data || []);
      } else {
        setError(result.message);
      }

      setLoading(false);
    }

    fetchData();
  }, [petId, days]);

  // Loading state
  if (loading) {
    return (
      <ChartContainer title={title} description={description} height={height}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ChartContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <ChartContainer title={title} description={description} height={height}>
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </ChartContainer>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <ChartContainer title={title} description={description} height={height}>
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-muted-foreground">
            No hay datos de consumo en este período
          </p>
        </div>
      </ChartContainer>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "dd MMM", { locale: es }),
    Servido: item.served,
    Comido: item.eaten,
    Meta: item.goal,
    Sobrante: item.leftover,
  }));

  return (
    <ChartContainer title={title} description={description} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid
            stroke={CHART_DEFAULTS.grid.stroke}
            strokeDasharray={CHART_DEFAULTS.grid.strokeDasharray}
            strokeOpacity={CHART_DEFAULTS.grid.strokeOpacity}
          />
          <XAxis
            dataKey="date"
            stroke={CHART_DEFAULTS.axis.stroke}
            fontSize={CHART_DEFAULTS.axis.fontSize}
            tickSize={CHART_DEFAULTS.axis.tickSize}
          />
          <YAxis
            stroke={CHART_DEFAULTS.axis.stroke}
            fontSize={CHART_DEFAULTS.axis.fontSize}
            tickSize={CHART_DEFAULTS.axis.tickSize}
            tickFormatter={(value) => formatGrams(value)}
          />
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(value) => formatGrams(value as number)}
                labelFormatter={(label) => `Fecha: ${label}`}
              />
            }
          />
          <Legend content={<ChartLegend />} />

          {/* Meta (línea punteada de referencia) */}
          <Line
            type="monotone"
            dataKey="Meta"
            stroke={CHART_COLORS.neutral}
            strokeWidth={CHART_DEFAULTS.strokeWidth}
            strokeDasharray="5 5"
            dot={false}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />

          {/* Servido (línea principal - base para meta) */}
          <Line
            type="monotone"
            dataKey="Servido"
            stroke={CHART_COLORS.primary}
            strokeWidth={CHART_DEFAULTS.strokeWidth}
            dot={{ r: 4 }}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />

          {/* Comido (tracking real de consumo) */}
          <Line
            type="monotone"
            dataKey="Comido"
            stroke={CHART_COLORS.success}
            strokeWidth={CHART_DEFAULTS.strokeWidth}
            dot={{ r: 4 }}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />

          {/* Sobrante (indicador de ajuste) */}
          <Line
            type="monotone"
            dataKey="Sobrante"
            stroke={CHART_COLORS.warning}
            strokeWidth={CHART_DEFAULTS.strokeWidth - 0.5}
            dot={{ r: 3 }}
            animationDuration={CHART_DEFAULTS.animationDuration}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
