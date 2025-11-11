# Dashboard Components

Componentes especializados para el dashboard de Pet SiKness.

---

## WeeklyStatsCard

Card de estadísticas semanales con contexto de días con datos.

### Características

- ✅ **Filtrado inteligente**: Solo promedia días con datos reales
- 📊 **Contexto visual**: Muestra "X/7 días con registros"
- ⚠️ **Advertencias**: Alerta si hay pocos datos (<3 días)
- 🎨 **Visual**: Color del badge según cumplimiento

### Uso

```tsx
import { WeeklyStatsCard } from "@/components/dashboard/WeeklyStatsCard";
import { getWeeklyStats } from "@/app/dashboard/actions";

async function DashboardPage() {
  const statsResult = await getWeeklyStats();

  if (!statsResult.ok) {
    return <div>Error: {statsResult.message}</div>;
  }

  return <WeeklyStatsCard stats={statsResult.data} />;
}
```

### Props

**WeeklyStatsCard**:

- `stats: WeeklyStatsData[]` - Array de estadísticas diarias
- `petName?: string` - Nombre de la mascota (opcional)

**WeeklyStatsList**:

- `statsByPet: Array<{ petName: string; stats: WeeklyStatsData[] }>` - Estadísticas agrupadas por mascota

### Interpretación de Estadísticas

#### Promedio de Cumplimiento

El promedio **solo incluye días con datos reales** para evitar distorsiones:

❌ **Antes (incorrecto)**:

- Lunes: 100% (1 toma)
- Martes: Sin datos → 0%
- Miércoles: Sin datos → 0%
- Promedio: 33% ❌ (misleading)

✅ **Ahora (correcto)**:

- Lunes: 100% (1 toma)
- Martes: Sin datos → (excluido del promedio)
- Miércoles: Sin datos → (excluido del promedio)
- Promedio: 100% ✅ (1/1 días con datos)
- Contexto: "100% (1/7 días con datos)" ✅

#### Días en Objetivo

Conteo de días donde se cumplió la meta (90-110% del objetivo).

**Ejemplo**:

- "5/6" → 5 días cumplieron objetivo de 6 días con datos
- No cuenta días sin registros en el denominador

#### Días con Datos

Muestra contexto esencial para interpretación:

- "7/7" → Semana completa registrada ✅
- "3/7" → Solo 3 días registrados ⚠️ (estadísticas menos confiables)
- "0/7" → Sin datos ❌

### Advertencias Automáticas

El componente muestra alertas contextuales:

1. **Sin datos** (0 días):

   - Mensaje: "No hay registros en los últimos 7 días"
   - Icono de calendario vacío

2. **Pocos datos** (1-2 días):

   - Banner amarillo: "Pocos datos disponibles..."
   - Las estadísticas se muestran pero con advertencia

3. **Datos confiables** (≥3 días):
   - Sin advertencias
   - Estadísticas mostradas normalmente

### Integración con Server Actions

La función `getWeeklyStats` en `app/dashboard/actions.ts` incluye:

```typescript
interface WeeklyStats {
  date: string;
  total_eaten: number;
  avg_achievement_pct: number;
  days_on_track: number;
  days_with_data: number; // ✨ Nuevo
  total_days: number; // ✨ Nuevo
}
```

Query mejorado:

```sql
-- ✨ FIXED: Filtrar días sin datos en promedio
AVG(goal_achievement_pct) FILTER (WHERE total_eaten_grams > 0)

-- ✨ NUEVO: Contar días con datos
COUNT(*) FILTER (WHERE total_eaten_grams > 0) as days_with_data
```

### Ejemplos de UI

**Card individual**:

```
┌─────────────────────────────────────┐
│ Tendencia Semanal - Michi   [87%]  │
├─────────────────────────────────────┤
│ 📅 5 de 7 días con registros        │
│                                     │
│ Promedio de cumplimiento      87%  │
│ Calculado sobre 5 días con datos   │
│                                     │
│ 📈 Total consumido           350g  │
│ ✓  Días en objetivo           4/5  │
│                                     │
│ 80% de los días cumplieron          │
└─────────────────────────────────────┘
```

**Con advertencia (pocos datos)**:

```
┌─────────────────────────────────────┐
│ Tendencia Semanal - Michi   [95%]  │
├─────────────────────────────────────┤
│ 📅 2 de 7 días con registros        │
│ ┌─────────────────────────────────┐ │
│ │ ⚠️ Pocos datos disponibles.     │ │
│ │ Las estadísticas pueden no ser  │ │
│ │ representativas.                │ │
│ └─────────────────────────────────┘ │
│ ...                                 │
└─────────────────────────────────────┘
```

**Sin datos**:

```
┌─────────────────────────────────────┐
│ Tendencia Semanal            [0%]   │
├─────────────────────────────────────┤
│ 📅 0 de 7 días con registros        │
│                                     │
│          📅                         │
│ No hay registros en los últimos     │
│           7 días                    │
└─────────────────────────────────────┘
```

---

## Mejores Prácticas

### 1. Siempre mostrar contexto

❌ **Malo**:

```tsx
<p>Promedio: {stats.avg_achievement_pct}%</p>
```

✅ **Bueno**:

```tsx
<p>Promedio: {stats.avg_achievement_pct}%</p>
<p className="text-xs text-muted-foreground">
  ({stats.days_with_data}/{stats.total_days} días con datos)
</p>
```

### 2. Validar datos antes de mostrar

```tsx
if (stats.days_with_data === 0) {
  return <EmptyState />;
}

if (stats.days_with_data < 3) {
  return <StatsWithWarning stats={stats} />;
}

return <Stats stats={stats} />;
```

### 3. Usar agregaciones correctas

❌ **Incorrecto**:

```typescript
// Promedia incluyendo días sin datos (distorsiona)
const avg = stats.reduce((sum, day) => sum + day.avg_achievement_pct, 0) / 7;
```

✅ **Correcto**:

```typescript
// Solo promedia días con datos reales
const daysWithData = stats.filter((day) => day.days_with_data > 0);
const avg =
  daysWithData.length > 0
    ? daysWithData.reduce((sum, day) => sum + day.avg_achievement_pct, 0) /
      daysWithData.length
    : 0;
```

---

## Testing

### Casos de prueba recomendados

1. **Semana completa (7/7 días)**
2. **Semana parcial (3-6 días)**
3. **Pocos datos (1-2 días)**
4. **Sin datos (0 días)**
5. **Días no consecutivos**
6. **Promedio alto con pocos datos** (ej: 100% con 1 día)

---

**Última actualización**: 11 Noviembre 2025
