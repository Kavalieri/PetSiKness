"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import { ChartContainer } from "../base/ChartContainer";
import { ChartTooltip } from "../base/ChartTooltip";
import { ChartLegend } from "../base/ChartLegend";
import { CHART_COLORS, formatGrams } from "@/lib/config/chart-theme";
import {
  getMacroDistribution,
  type MacroDistributionData,
} from "@/lib/actions/analytics-data";
import { Loader2 } from "lucide-react";

// ============================================
// TYPES
// ============================================

interface MacronutrientPieChartProps {
  /**
   * ID de la mascota (requerido)
   */
  petId: string;

  /**
   * Número de días para cálculo
   * @default 30
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
// CONSTANTS
// ============================================

const MACRO_COLORS = {
  Proteína: CHART_COLORS.protein,
  Grasa: CHART_COLORS.fat,
  Carbohidratos: CHART_COLORS.carbs,
};

// ============================================
// COMPONENT
// ============================================

/**
 * Gráfico circular con distribución de macronutrientes
 *
 * Muestra el % de proteína, grasa y carbohidratos consumidos
 * en el período especificado.
 *
 * @example
 * ```tsx
 * <MacronutrientPieChart petId="pet-123" days={30} />
 * ```
 */
export function MacronutrientPieChart({
  petId,
  days = 30,
  height = "350px",
  title = "Distribución de Macronutrientes",
  description = "Últimos 30 días",
}: MacronutrientPieChartProps) {
  const [data, setData] = useState<MacroDistributionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getMacroDistribution(petId, days);

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
            No hay datos nutricionales en este período
          </p>
        </div>
      </ChartContainer>
    );
  }

  // Transform data for Recharts
  const chartData = data.map((item) => ({
    name: item.name,
    value: item.value,
    percentage: item.percentage,
  }));

  return (
    <ChartContainer title={title} description={description} height={height}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={MACRO_COLORS[entry.name as keyof typeof MACRO_COLORS]}
              />
            ))}
          </Pie>
          <Tooltip
            content={
              <ChartTooltip
                valueFormatter={(value) => formatGrams(value as number)}
              />
            }
          />
          <Legend content={<ChartLegend />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
