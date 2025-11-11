/**
 * Pet SiKness - Analytics Module
 * 
 * Sistema completo de Business Intelligence para análisis nutricional.
 * 
 * ## Instalación
 * 
 * ```bash
 * npm install recharts @tanstack/react-table
 * npm install --save-dev @types/recharts
 * ```
 * 
 * ## Componentes Base
 * 
 * ### ChartContainer
 * Wrapper estándar para todos los gráficos.
 * 
 * ### MetricCard
 * Tarjeta para mostrar métricas clave con cambio %.
 * 
 * ### TrendCard
 * Combina métrica + sparkline.
 * 
 * ### ChartTooltip, ChartLegend
 * Componentes personalizados para Recharts.
 * 
 * ### TableFilters
 * Barra de filtros reutilizable para tablas.
 * 
 * ## Gráficos
 * 
 * ### ConsumptionTrendChart
 * Tendencia de consumo diario (líneas).
 * 
 * ### MacronutrientPieChart
 * Distribución de proteína/grasa/carbohidratos (pie).
 * 
 * ## Tablas
 * 
 * ### FeedingHistoryTable
 * Historial completo con sorting y paginación.
 */

// Base components
export * from "./base";
export * from "./cards";

// Charts
export * from "./charts";

// Tables
export * from "./tables";
