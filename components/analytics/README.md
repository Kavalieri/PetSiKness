# 📊 Analytics Module - Pet SiKness

Sistema completo de Business Intelligence para análisis nutricional de mascotas.

---

## 🚀 Quick Start

### Instalación

Las dependencias ya están instaladas en el proyecto:

```bash
npm install recharts @tanstack/react-table
npm install --save-dev @types/recharts
```

### Uso Básico

```tsx
import {
  ConsumptionTrendChart,
  MacronutrientPieChart,
  FeedingHistoryTable,
  MetricCard,
  TrendCard,
} from "@/components/analytics";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Métricas clave */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Consumo Promedio"
          value="450g"
          change={5.2}
          trend="up"
          description="vs semana anterior"
        />
        <TrendCard
          title="Tendencia Semanal"
          value="3.2kg"
          change={-2.1}
          trend="down"
          data={weeklyData}
        />
      </div>

      {/* Gráficos */}
      <ConsumptionTrendChart petId="pet-123" days={7} />
      <MacronutrientPieChart petId="pet-123" days={30} />

      {/* Tabla */}
      <FeedingHistoryTable petId="pet-123" pageSize={10} />
    </div>
  );
}
```

---

## 📦 Componentes

### Base Components

#### ChartContainer

Wrapper estándar para gráficos con Card, título y acciones.

```tsx
<ChartContainer
  title="Mi Gráfico"
  description="Últimos 7 días"
  height="350px"
  actions={<Button>Exportar</Button>}
>
  <LineChart data={data}>...</LineChart>
</ChartContainer>
```

**Props:**

- `title` (string) - Título del gráfico
- `description?` (string) - Descripción opcional
- `children` (ReactNode) - Componente de gráfico Recharts
- `height?` (string | number) - Height del contenedor (default: "300px")
- `actions?` (ReactNode) - Botones de acción

---

#### MetricCard

Tarjeta para mostrar métricas clave con indicador de cambio.

```tsx
<MetricCard
  title="Consumo Diario"
  value="450g"
  change={5.2}
  trend="up"
  icon={<TrendingUp />}
  description="vs ayer"
  invertedChange={false}
/>
```

**Props:**

- `title` (string) - Título de la métrica
- `value` (string | number) - Valor principal
- `change?` (number) - Cambio % vs período anterior
- `trend?` ("up" | "down" | "neutral") - Dirección de tendencia
- `icon?` (ReactNode) - Ícono opcional
- `description?` (string) - Descripción adicional
- `invertedChange?` (boolean) - Si true, cambio negativo es positivo

---

#### TrendCard

Combina métrica con sparkline (mini gráfico de área).

```tsx
<TrendCard
  title="Consumo Semanal"
  value="3.2kg"
  change={12.5}
  trend="up"
  data={[
    { label: "Lun", value: 450 },
    { label: "Mar", value: 480 },
    // ...
  ]}
  showAxis={false}
/>
```

**Props:**

- `title` (string) - Título de la métrica
- `value` (string | number) - Valor principal actual
- `data` (DataPoint[]) - Datos de tendencia
- `change?` (number) - Cambio %
- `trend?` ("up" | "down" | "neutral") - Tendencia
- `color?` (string) - Color del gráfico
- `showAxis?` (boolean) - Si mostrar eje X (default: false)

---

#### ChartTooltip

Tooltip personalizado para Recharts.

```tsx
<Tooltip
  content={
    <ChartTooltip
      valueFormatter={(v) => `${v}g`}
      labelFormatter={(l) => format(new Date(l), "dd MMM")}
      showIndicator={true}
    />
  }
/>
```

**Props:**

- `valueFormatter?` ((value, name?) => string) - Formatea valores
- `labelFormatter?` ((label) => string) - Formatea labels
- `showIndicator?` (boolean) - Mostrar indicador de color (default: true)

---

#### ChartLegend

Leyenda personalizada para Recharts.

```tsx
<Legend
  content={<ChartLegend labelFormatter={(v) => capitalize(v)} align="right" />}
/>
```

**Props:**

- `labelFormatter?` ((value) => string) - Formatea labels
- `align?` ("left" | "center" | "right") - Alineación (default: "center")

---

#### TableFilters

Barra de filtros para tablas.

```tsx
<TableFilters
  searchValue={search}
  onSearchChange={setSearch}
  searchPlaceholder="Buscar alimento..."
  filters={[
    {
      id: "pet",
      label: "Mascota",
      value: petId,
      options: pets.map((p) => ({ label: p.name, value: p.id })),
      onChange: setPetId,
    },
  ]}
  onReset={() => {
    setSearch("");
    setPetId("");
  }}
/>
```

**Props:**

- `searchValue?` (string) - Valor de búsqueda
- `onSearchChange?` ((value) => void) - Callback de búsqueda
- `searchPlaceholder?` (string) - Placeholder del input
- `filters?` (FilterOption[]) - Filtros de selección
- `onReset?` (() => void) - Callback para resetear

---

### Charts

#### ConsumptionTrendChart

Gráfico de líneas con tendencia de consumo diario.

```tsx
<ConsumptionTrendChart
  petId="pet-123"
  days={7}
  height="350px"
  title="Tendencia de Consumo"
  description="Últimos 7 días"
/>
```

**Props:**

- `petId?` (string) - ID de mascota (opcional, muestra todas si se omite)
- `days?` (number) - Número de días (default: 7)
- `height?` (string | number) - Height (default: "350px")
- `title?` (string) - Título personalizado
- `description?` (string) - Descripción personalizada

**Muestra:**

- Línea "Servido" (cantidad servida - base para meta) - Azul
- Línea "Comido" (consumo real) - Verde
- Línea "Meta" (objetivo diario) - Gris punteado
- Línea "Sobrante" (diferencia served-eaten) - Amarillo

**Datos:**
Obtiene datos reales desde `getDailyConsumptionTrend()` server action.

---

#### MacronutrientPieChart

Gráfico circular con distribución de macronutrientes.

```tsx
<MacronutrientPieChart
  petId="pet-123"
  days={30}
  height="350px"
  title="Distribución de Macros"
  description="Últimos 30 días"
/>
```

**Props:**

- `petId` (string) - ID de mascota (requerido)
- `days?` (number) - Período de análisis (default: 30)
- `height?` (string | number) - Height (default: "350px")
- `title?` (string) - Título personalizado
- `description?` (string) - Descripción personalizada

**Muestra:**

- Proteína (rojo)
- Grasa (naranja)
- Carbohidratos (amarillo)
- Con % sobre cada segmento

**Datos:**
Calcula distribución real desde tabla `feedings` + `foods`.

---

### Tables

#### FeedingHistoryTable

Tabla completa de historial de alimentación con TanStack Table v8.

```tsx
<FeedingHistoryTable
  petId="pet-123"
  pageSize={10}
  title="Historial de Alimentación"
/>
```

**Props:**

- `petId?` (string) - ID de mascota (opcional)
- `pageSize?` (number) - Registros por página (default: 10)
- `title?` (string) - Título personalizado

**Features:**

- Sorting por columnas
- Paginación automática
- Loading states
- Empty states
- Responsive

**Columnas:**

1. Fecha (DD MMM YYYY)
2. Hora (HH:MM)
3. Mascota (nombre)
4. Alimento (nombre)
5. Ración (#1, #2, etc.)
6. Servido (gramos)
7. Comido (gramos)
8. Sobra (gramos, amarillo si > 0)
9. Apetito (badge con colores)

**Datos:**
Obtiene datos reales desde `getFeedingHistory()` server action.

---

## 🎨 Theming

### Chart Theme

Todos los colores y configuraciones están en `lib/config/chart-theme.ts`.

```tsx
import {
  CHART_COLORS,
  CHART_DEFAULTS,
  getComplianceColor,
  formatGrams,
} from "@/lib/config/chart-theme";

// Usar colores
stroke={CHART_COLORS.primary}
fill={CHART_COLORS.success}

// Usar utilidades
tickFormatter={formatGrams}
stroke={getComplianceColor(percentage)}
```

**Colores disponibles:**

**System:**

- `primary`, `secondary`, `success`, `warning`, `danger`, `neutral`

**Food types:**

- `dry`, `wet`, `raw`, `homemade`, `treats`

**Macronutrients:**

- `protein`, `fat`, `carbs`, `fiber`, `moisture`

**Compliance:**

- `underTarget`, `metTarget`, `overTarget`, `pending`

**Species:**

- `cat`, `dog`, `bird`, `rabbit`, `other`

**Utilidades:**

- `getComplianceColor(percentage)` - Color según % de cumplimiento
- `getFoodTypeColor(foodType)` - Color por tipo de alimento
- `getSpeciesColor(species)` - Color por especie
- `getNutrientColor(nutrient)` - Color por macronutriente
- `getChartColorPalette(count)` - Array de N colores
- `formatChartNumber(value)` - 1000 → "1K"
- `formatPercentage(value, decimals)` - Formatear %
- `formatGrams(value)` - Formatear g/kg

---

## 📊 Server Actions

### getDailyConsumptionTrend

Obtiene tendencia de consumo diario.

```typescript
const result = await getDailyConsumptionTrend(petId?, days?);

if (result.ok) {
  const data: DailyConsumptionData[] = result.data;
  // data[0].date, .served, .eaten, .leftover, .goal, .compliancePercentage
}
```

### getMacroDistribution

Calcula distribución de macronutrientes.

```typescript
const result = await getMacroDistribution(petId, days?);

if (result.ok) {
  const data: MacroDistributionData[] = result.data;
  // data[0].name, .value, .percentage
}
```

### getFeedingHistory

Obtiene historial con paginación.

```typescript
const result = await getFeedingHistory(petId?, limit?, offset?);

if (result.ok) {
  const data: FeedingHistoryData[] = result.data;
  // data[0].id, .date, .time, .petName, .foodName, .served, .eaten, etc.
}
```

---

## 🔧 Customization

### Crear Gráfico Personalizado

```tsx
"use client";

import { ChartContainer } from "@/components/analytics/base";
import { LineChart, Line, XAxis, YAxis } from "recharts";
import { CHART_COLORS, CHART_DEFAULTS } from "@/lib/config/chart-theme";

export function MyCustomChart({ data }) {
  return (
    <ChartContainer title="Mi Gráfico" description="Custom">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            stroke={CHART_DEFAULTS.axis.stroke}
            fontSize={CHART_DEFAULTS.axis.fontSize}
          />
          <YAxis stroke={CHART_DEFAULTS.axis.stroke} />
          <Line
            dataKey="value"
            stroke={CHART_COLORS.primary}
            strokeWidth={CHART_DEFAULTS.strokeWidth}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
```

### Crear Tabla Personalizada

```tsx
"use client";

import { useReactTable, getCoreRowModel } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead } from "@/components/ui/table";

const columns = [
  { accessorKey: "name", header: "Nombre" },
  { accessorKey: "value", header: "Valor" },
];

export function MyCustomTable({ data }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <Table>
      <TableHead>
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => (
              <TableHead key={header.id}>
                {flexRender(
                  header.column.columnDef.header,
                  header.getContext()
                )}
              </TableHead>
            ))}
          </TableRow>
        ))}
      </TableHead>
      <TableBody>
        {table.getRowModel().rows.map((row) => (
          <TableRow key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <TableCell key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 📝 Notas de Implementación

### Lógica de Negocio (Cambio 11/11/2025)

**Meta basada en cantidad SERVIDA, no comida:**

- `served` = Base para cumplimiento de meta ✅
- `eaten` = Tracking de consumo real
- `leftover` = Indicador de ajuste necesario

Esto permite:

- Control de porciones por parte del alimentador
- Documentación de desperdicio
- Ajuste basado en sobrantes históricos

### Performance

- Todos los componentes usan `"use client"` (cliente-side)
- Server Actions cachean queries (próxima implementación)
- Tablas con paginación (máx 100 registros iniciales)
- Gráficos responsive con ResponsiveContainer

### Accessibility

- Colores con suficiente contraste
- Tooltips informativos
- Labels descriptivos
- Keyboard navigation en tablas

---

## 🐛 Troubleshooting

### "Cannot find module 'recharts'"

```bash
npm install recharts @tanstack/react-table
```

### "Property 'XXX' does not exist on type..."

Regenera los types de base de datos:

```bash
npm run types:generate:dev
```

### Gráfico no muestra datos

1. Verifica que haya registros en `feedings` table
2. Verifica que el `householdId` sea correcto
3. Revisa la consola del navegador para errores

### Tabla vacía

1. Verifica query en `getFeedingHistory()`
2. Verifica que `petId` exista
3. Revisa el network tab para respuesta de API

---

## 📚 Referencias

- **Recharts**: https://recharts.org/
- **TanStack Table**: https://tanstack.com/table/v8
- **shadcn/ui**: https://ui.shadcn.com/

---

**Última actualización:** 12 Noviembre 2025
**Versión:** 1.0.0 - Sistema completo implementado
