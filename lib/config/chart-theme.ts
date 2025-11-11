/**
 * Chart Theme Configuration
 * Pet SiKness - Analytics System
 *
 * Colores consistentes con shadcn/ui y temática de mascotas
 */

// ============================================
// PALETA DE COLORES
// ============================================

export const CHART_COLORS = {
  // Colores base del sistema
  primary: "hsl(var(--primary))",
  secondary: "hsl(var(--secondary))",
  success: "hsl(142, 76%, 36%)", // Verde para metas cumplidas
  warning: "hsl(38, 92%, 50%)", // Amarillo para alertas
  danger: "hsl(0, 84%, 60%)", // Rojo para crítico
  neutral: "hsl(var(--muted))",
  background: "hsl(var(--background))",
  foreground: "hsl(var(--foreground))",

  // Categorías de alimentos
  dry: "hsl(30, 80%, 55%)", // Naranja (alimento seco)
  wet: "hsl(200, 80%, 55%)", // Azul (alimento húmedo)
  raw: "hsl(0, 70%, 55%)", // Rojo oscuro (dieta cruda)
  homemade: "hsl(120, 60%, 50%)", // Verde (casero)
  treats: "hsl(280, 60%, 60%)", // Morado (premios)

  // Macronutrientes
  protein: "hsl(0, 70%, 55%)", // Rojo (carne)
  fat: "hsl(45, 90%, 55%)", // Amarillo (aceite)
  carbs: "hsl(30, 80%, 60%)", // Naranja (granos)
  fiber: "hsl(120, 50%, 45%)", // Verde (vegetales)
  moisture: "hsl(200, 70%, 60%)", // Azul claro (humedad)

  // Estados de cumplimiento
  underTarget: "hsl(0, 84%, 60%)", // Rojo (bajo meta)
  metTarget: "hsl(142, 76%, 36%)", // Verde (cumplido)
  overTarget: "hsl(38, 92%, 50%)", // Amarillo (sobre meta)
  pending: "hsl(var(--muted))", // Gris (pendiente)

  // Especies de mascotas
  cat: "hsl(280, 60%, 60%)", // Morado
  dog: "hsl(30, 80%, 55%)", // Naranja
  bird: "hsl(200, 80%, 55%)", // Azul
  rabbit: "hsl(120, 60%, 50%)", // Verde
  other: "hsl(var(--muted))", // Gris

  // Gradientes para trends
  gradient: {
    start: "hsl(var(--primary))",
    end: "hsl(var(--primary) / 0.3)",
  },
} as const;

// ============================================
// CONFIGURACIÓN POR DEFECTO DE CHARTS
// ============================================

export const CHART_DEFAULTS = {
  // Líneas y bordes
  strokeWidth: 2,
  strokeDasharray: "0",

  // Animaciones
  animationDuration: 300,
  animationEasing: "ease-in-out" as const,

  // Grid
  grid: {
    stroke: "hsl(var(--border))",
    strokeDasharray: "3 3",
    strokeOpacity: 0.3,
  },

  // Ejes
  axis: {
    stroke: "hsl(var(--muted-foreground))",
    fontSize: 12,
    fontFamily: "var(--font-sans)",
    tickSize: 5,
  },

  // Tooltips
  tooltip: {
    contentStyle: {
      backgroundColor: "hsl(var(--popover))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "var(--radius)",
      padding: "0.75rem",
      color: "hsl(var(--popover-foreground))",
    },
    cursor: {
      stroke: "hsl(var(--border))",
      strokeWidth: 1,
      strokeDasharray: "5 5",
    },
  },

  // Leyendas
  legend: {
    iconSize: 12,
    iconType: "circle" as const,
    wrapperStyle: {
      fontSize: 12,
      fontFamily: "var(--font-sans)",
    },
  },

  // Responsive
  responsive: {
    mobile: 320,
    tablet: 768,
    desktop: 1024,
  },
} as const;

// ============================================
// UTILIDADES DE COLOR
// ============================================

/**
 * Obtiene el color según el estado de cumplimiento de meta
 */
export function getComplianceColor(percentage: number): string {
  if (percentage < 90) return CHART_COLORS.underTarget;
  if (percentage <= 110) return CHART_COLORS.metTarget;
  return CHART_COLORS.overTarget;
}

/**
 * Obtiene el color según el tipo de alimento
 */
export function getFoodTypeColor(
  foodType: "dry" | "wet" | "raw" | "homemade" | "treats"
): string {
  return CHART_COLORS[foodType];
}

/**
 * Obtiene el color según la especie
 */
export function getSpeciesColor(
  species: "cat" | "dog" | "bird" | "rabbit" | "other"
): string {
  return CHART_COLORS[species] || CHART_COLORS.other;
}

/**
 * Obtiene el color según el macronutriente
 */
export function getNutrientColor(
  nutrient: "protein" | "fat" | "carbs" | "fiber" | "moisture"
): string {
  return CHART_COLORS[nutrient];
}

/**
 * Genera un array de colores para charts con múltiples series
 */
export function getChartColorPalette(count: number): string[] {
  const baseColors = [
    CHART_COLORS.primary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
    CHART_COLORS.dry,
    CHART_COLORS.wet,
    CHART_COLORS.treats,
    CHART_COLORS.cat,
    CHART_COLORS.dog,
  ];

  // Si necesitamos más colores de los que tenemos, repetimos con opacidad
  if (count <= baseColors.length) {
    return baseColors.slice(0, count);
  }

  const result: string[] = [...baseColors];
  let opacity = 0.7;

  while (result.length < count) {
    baseColors.forEach((color) => {
      if (result.length < count) {
        result.push(`${color} / ${opacity.toFixed(2)}`);
      }
    });
    opacity -= 0.2;
  }

  return result;
}

// ============================================
// FORMATOS DE NÚMEROS
// ============================================

/**
 * Formatea números para mostrar en charts (K, M notation)
 */
export function formatChartNumber(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toString();
}

/**
 * Formatea porcentajes para charts
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Formatea gramos para charts
 */
export function formatGrams(value: number): string {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}kg`;
  }
  return `${value}g`;
}
