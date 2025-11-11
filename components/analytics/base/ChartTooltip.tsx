"use client";

import { cn } from "@/lib/utils";
import { TooltipProps } from "recharts";

// ============================================
// TYPES
// ============================================

interface PayloadEntry {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
}

interface ChartTooltipProps {
  /**
   * Si el tooltip está activo
   */
  active?: boolean;

  /**
   * Datos del tooltip
   */
  payload?: PayloadEntry[];

  /**
   * Label del tooltip (ej: fecha)
   */
  label?: string | number;

  /**
   * Formatter personalizado para valores
   */
  valueFormatter?: (value: number | string, name?: string) => string;

  /**
   * Formatter personalizado para labels
   */
  labelFormatter?: (label: string | number) => string;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Si true, muestra el indicador de color
   * @default true
   */
  showIndicator?: boolean;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Tooltip personalizado para gráficos Recharts
 * 
 * Provee:
 * - Estilo consistente con el theme
 * - Formateo personalizado de valores
 * - Indicadores de color por serie
 * - Soporte dark mode
 * 
 * @example
 * ```tsx
 * <LineChart data={data}>
 *   <Tooltip
 *     content={
 *       <ChartTooltip
 *         valueFormatter={(v) => `${v}g`}
 *         labelFormatter={(l) => format(new Date(l), "dd MMM")}
 *       />
 *     }
 *   />
 * </LineChart>
 * ```
 */
export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
  labelFormatter,
  className,
  showIndicator = true,
}: ChartTooltipProps) {
  // No mostrar si inactivo o sin datos
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border bg-background p-3 shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {/* Label (fecha, categoría, etc.) */}
      {label && (
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          {labelFormatter ? labelFormatter(label) : label}
        </p>
      )}

      {/* Valores */}
      <div className="space-y-1">
        {payload.map((entry, index) => {
          const { name, value, color, dataKey } = entry;
          const displayName = name || dataKey;
          const safeValue = value ?? 0;
          const formattedValue = valueFormatter
            ? valueFormatter(safeValue, displayName)
            : safeValue;

          return (
            <div key={`item-${index}`} className="flex items-center gap-2">
              {/* Indicador de color */}
              {showIndicator && (
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
              )}

              {/* Nombre y valor */}
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  {displayName}
                </span>
                <span className="text-xs font-semibold">{formattedValue}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
