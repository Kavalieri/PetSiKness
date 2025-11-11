"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ============================================
// TYPES
// ============================================

interface ChartContainerProps {
  /**
   * Título del gráfico
   */
  title: string;

  /**
   * Descripción opcional del gráfico
   */
  description?: string;

  /**
   * Contenido del gráfico (componente Recharts)
   */
  children: React.ReactNode;

  /**
   * Clases CSS adicionales
   */
  className?: string;

  /**
   * Acciones adicionales (botones, etc.)
   */
  actions?: React.ReactNode;

  /**
   * Height del contenedor del gráfico
   * @default "300px"
   */
  height?: string | number;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Contenedor estándar para gráficos
 *
 * Provee:
 * - Card wrapper consistente
 * - Header con título y descripción
 * - Área de acciones (export, etc.)
 * - Responsive container
 * - Height configurable
 *
 * @example
 * ```tsx
 * <ChartContainer
 *   title="Consumo Diario"
 *   description="Últimos 7 días"
 *   actions={<Button>Exportar</Button>}
 * >
 *   <LineChart data={data}>...</LineChart>
 * </ChartContainer>
 * ```
 */
export function ChartContainer({
  title,
  description,
  children,
  className,
  actions,
  height = "300px",
}: ChartContainerProps) {
  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </CardHeader>
      <CardContent>
        <div
          className="w-full"
          style={{
            height: typeof height === "number" ? `${height}px` : height,
          }}
        >
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
