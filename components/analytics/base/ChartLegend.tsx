"use client";

import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface LegendPayload {
  value?: string;
  color?: string;
  dataKey?: string;
}

interface ChartLegendProps {
  /**
   * Datos de la leyenda
   */
  payload?: LegendPayload[];

  /**
   * Formatter personalizado para labels
   */
  labelFormatter?: (value: string) => string;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Alineación de la leyenda
   * @default "center"
   */
  align?: "left" | "center" | "right";
}

// ============================================
// COMPONENT
// ============================================

/**
 * Leyenda personalizada para gráficos Recharts
 *
 * Provee:
 * - Estilo consistente con el theme
 * - Responsive (oculta en móvil si es necesario)
 * - Formateo personalizado de labels
 * - Soporte dark mode
 *
 * @example
 * ```tsx
 * <LineChart data={data}>
 *   <Legend
 *     content={
 *       <ChartLegend
 *         labelFormatter={(v) => capitalize(v)}
 *         align="right"
 *       />
 *     }
 *   />
 * </LineChart>
 * ```
 */
export function ChartLegend({
  payload,
  labelFormatter,
  className,
  align = "center",
}: ChartLegendProps) {
  // No mostrar si no hay datos
  if (!payload || payload.length === 0) {
    return null;
  }

  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 pt-4",
        alignmentClasses[align],
        className
      )}
    >
      {payload.map((entry, index) => {
        const { value, color, dataKey } = entry;
        const rawValue = value || dataKey || "";
        const displayValue = labelFormatter
          ? labelFormatter(rawValue)
          : rawValue;

        return (
          <div key={`legend-item-${index}`} className="flex items-center gap-2">
            {/* Indicador de color */}
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color }}
            />

            {/* Label */}
            <span className="text-xs font-medium text-muted-foreground">
              {displayValue}
            </span>
          </div>
        );
      })}
    </div>
  );
}
