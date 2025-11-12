# 📊 Análisis Completo: Flujo de Alimentación

**Fecha**: 12 de Noviembre de 2025
**Estado**: Análisis para reestructuración
**Versión**: 1.2.0

---

## 🎯 Resumen Ejecutivo

El sistema actual de alimentación tiene **redundancias y nomenclatura inconsistente** que confunden el flujo de trabajo:

### Problemas Identificados

1. **❌ Múltiples puntos de creación/edición sin claridad**:
   - "Registrar comida" → Debería ser "Registrar ración"
   - Dashboard → Permite editar/crear raciones
   - No está claro cuándo usar cada uno

2. **❌ Nomenclatura inconsistente**:
   - UI usa "tomas" en algunos lugares
   - Backend usa `portion_number` (correcto)
   - Confusión entre "toma" y "ración"

3. **❌ Flujo no intuitivo**:
   - Usuarios crean raciones manualmente vs. editar raciones pre-configuradas
   - No hay distinción clara entre "ración programada" y "ración registrada"

---

## 📋 Estado Actual del Sistema

### Modelo de Datos

```
pet_portion_schedules (Configuración - Lo que DEBERÍA comer)
├── pet_id
├── portion_number (1, 2, 3...)
├── scheduled_time (08:00, 14:00, 20:00)
├── expected_grams (cantidad esperada por ración)
└── notes

feedings (Registro Real - Lo que COMIÓ)
├── pet_id
├── feeding_date
├── portion_number (vincula con schedule)
├── food_id
├── amount_served_grams (lo servido)
├── amount_leftover_grams (lo que sobró) ✨ Input desde Issue #65
├── amount_eaten_grams (calculado: served - leftover)
└── ... (appetite, stool, etc.)
```

**Relación**: `pet_portion_schedules` define **qué debería pasar** (plan), `feedings` registra **qué pasó realmente** (ejecución).

### Flujos Actuales

#### 1️⃣ Registrar desde "/feeding" (Registro Multi-Mascota)

**Ruta**: `/app/feeding`
**Acción**: `createMultiPetFeeding()`
**Componente**: `FeedingForm.tsx`

**Proceso**:
```
Usuario selecciona:
├── Alimento (común para todas)
├── Fecha y hora
├── Mascotas (múltiples)
└── Por cada mascota:
    ├── Cantidad servida
    ├── Cantidad sobrante ✨ (Issue #65)
    └── Detalles opcionales (apetito, etc.)

Sistema:
├── Calcula portion_number automáticamente:
│   SELECT MAX(portion_number) + 1 WHERE pet_id = X AND date = Y
├── Inserta N registros en feedings (uno por mascota)
└── NO valida contra pet_portion_schedules
```

**Problema**: 
- ❌ Usuario elige portion_number implícitamente (el siguiente disponible)
- ❌ No hay relación con raciones programadas
- ❌ Puede crear más raciones de las configuradas

#### 2️⃣ Editar desde Dashboard (Actualizar Ración Específica)

**Ruta**: `/app/dashboard`
**Acción**: `updatePortionAmount()`
**Componente**: `DailyBalanceCard.tsx` → `MealCard`

**Proceso**:
```
Usuario edita:
├── petId (fijo)
├── portionNumber (fijo - viene del schedule)
├── servedGrams (editable)
└── leftoverGrams (editable) ✨ (Issue #65)

Sistema:
├── Busca feeding existente:
│   WHERE pet_id = X AND date = Y AND portion_number = Z
├── Si existe → UPDATE
├── Si NO existe → INSERT con:
│   ├── food_id = primer alimento del household (placeholder)
│   ├── served/leftover del usuario
│   └── eaten calculado automáticamente
└── Revalida /dashboard
```

**Problema**:
- ✅ Respeta portion_number de schedules
- ❌ Crea feeding con food_id "placeholder" si no existe
- ❌ No permite elegir alimento desde dashboard

#### 3️⃣ Editar desde "/feeding/[id]/edit"

**Ruta**: `/app/feeding/[id]/edit`
**Acción**: `updateFeeding()`
**Componente**: `EditFeedingClient.tsx`

**Proceso**:
```
Usuario edita feeding existente:
├── Cambia food_id
├── Cambia cantidades
├── Cambia fecha (recalcula portion_number)
└── Cambia detalles

Sistema:
├── UPDATE feedings WHERE id = X
├── Si cambió fecha:
│   └── Recalcula portion_number (MAX + 1 en nueva fecha)
└── Revalida /dashboard y /feeding
```

**Problema**:
- ✅ Permite editar todo
- ❌ Al cambiar fecha, puede duplicar portion_numbers no deseados

### Inconsistencias de Nomenclatura

**Lugares donde se usa "toma" en vez de "ración"**:

```typescript
// ❌ lib/schemas/meal-schedule.ts
"El número de toma es obligatorio"
"Debe haber al menos una toma programada"
"No puede haber dos tomas programadas a la misma hora"

// ❌ components/feeding/DailyBalanceCard.tsx
"Card individual de una toma"
"{completedMeals}/{totalMeals} tomas"
"Hay 1 toma retrasada"
"¡Excelente! Todas las tomas del día han sido completadas."

// ❌ app/dashboard/page.tsx
"${delayedCount} toma${delayedCount > 1 ? 's' : ''} retrasada"

// ❌ lib/utils/portion-balance.ts
"como parte de una toma específica"
"antes de considerar una toma como 'retrasada'"
```

---

## 🎯 Propuesta de Flujo Ideal

### Modelo Mental Simplificado

```
1. CONFIGURAR raciones por mascota
   ├── Cuántas raciones por día (daily_portions_target)
   ├── A qué horas (scheduled_time)
   └── Cuánto en cada ración (expected_grams) [opcional]

2. DASHBOARD muestra raciones del día
   ├── Estado: PENDING | COMPLETED | DELAYED
   ├── Usuario edita SOLO cantidades (served + leftover)
   └── Si no existe feeding, crea con alimento por defecto

3. ALIMENTACIÓN (opcional) - para detalles completos
   ├── Crear feeding con TODO detallado (alimento, apetito, heces, etc.)
   ├── Editar feedings existentes
   └── Historial completo con filtros
```

### Flujo Propuesto Paso a Paso

#### A. Configuración Inicial (Una sola vez por mascota)

**Dónde**: `/app/pets/[id]/edit`

```
Usuario configura:
├── daily_portions_target: 3
└── Horarios (auto-generados o manuales):
    ├── Ración 1: 08:00 (150g esperados)
    ├── Ración 2: 14:00 (150g esperados)
    └── Ración 3: 20:00 (150g esperados)

Sistema guarda en:
└── pet_portion_schedules (3 registros)
```

#### B. Dashboard - Vista Diaria (Uso Principal)

**Dónde**: `/app/dashboard`

```
Sistema muestra:
└── Por cada mascota:
    ├── Ración 1 [08:00] - 150g esperados
    │   ├── Estado: PENDING (si hora futura)
    │   ├── Estado: DELAYED (si pasó hora + 30min sin registro)
    │   └── Estado: COMPLETED (si hay feeding registrado)
    │
    ├── [Click en ración] → Mini-formulario:
    │   ├── Servido: ___ g (pre-llenado con expected_grams)
    │   ├── Sobrante: ___ g
    │   ├── Alimento: [Dropdown - primer uso, luego recuerda último]
    │   └── [Guardar] → Crea/actualiza feeding
    │
    └── Total día: 450g / 450g (100%) ✅

Beneficios:
├── ✅ Un solo lugar para registrar comidas diarias
├── ✅ Respeta configuración de raciones
├── ✅ No permite crear raciones extra sin querer
└── ✅ Flujo rápido: clic → ingresar cantidades → guardar
```

#### C. Alimentación - Detalles Completos (Uso Avanzado)

**Dónde**: `/app/feeding`

```
Casos de uso:
├── Ver historial completo con filtros
├── Editar feeding existente con TODOS los detalles:
│   ├── Alimento usado
│   ├── Apetito, velocidad de comida
│   ├── Resultados digestivos (vómito, diarrea, heces)
│   └── Notas
└── Crear feeding manual (fuera de horario programado)

NO permite:
└── ❌ Crear raciones grupales "en blanco"
```

### Cambios Necesarios

#### 1. Dashboard: Permitir seleccionar alimento

**Archivo**: `components/feeding/DailyBalanceCard.tsx` → `MealCard`

```typescript
// ANTES (solo cantidades)
<input name="served" />
<input name="leftover" />

// DESPUÉS (agregar dropdown de alimento)
<select name="food_id">
  {householdFoods.map(food => (
    <option value={food.id}>{food.name}</option>
  ))}
</select>
<input name="served" />
<input name="leftover" />
```

**Beneficio**: Ya no usar food_id "placeholder".

#### 2. Unificar nomenclatura: "toma" → "ración"

**Archivos a modificar**:
- `lib/schemas/meal-schedule.ts` (mensajes de error)
- `components/feeding/DailyBalanceCard.tsx` (UI strings)
- `app/dashboard/page.tsx` (alertas)
- `lib/utils/portion-balance.ts` (comentarios)

**Reemplazo global**: `toma` → `ración`, `Toma` → `Ración`

#### 3. Eliminar registro multi-mascota desde /feeding

**Opción A** (Conservadora): Mover a "Avanzado"
**Opción B** (Radical): Eliminar completamente

**Razón**: Dashboard cubre 90% de casos de uso diario.

#### 4. Validar portion_number contra schedules

**Archivo**: `app/feeding/actions.ts` → `createFeeding()`

```typescript
// AGREGAR validación
const scheduleCheck = await query(
  `SELECT portion_number FROM pet_portion_schedules 
   WHERE pet_id = $1 AND portion_number = $2`,
  [validated.pet_id, calculatedPortionNumber]
);

if (scheduleCheck.rows.length === 0) {
  return fail(
    `Esta mascota no tiene configurada la ración ${calculatedPortionNumber}. 
     Configúrala primero en el perfil de la mascota.`
  );
}
```

---

## 📊 Comparativa: Antes vs. Después

| Aspecto | ANTES (Actual) | DESPUÉS (Propuesto) |
|---------|----------------|---------------------|
| **Crear ración diaria** | `/feeding` → Formulario complejo multi-mascota | Dashboard → Click en ración → Ingresar cantidades |
| **Alimento en dashboard** | ❌ Placeholder automático | ✅ Dropdown seleccionable |
| **Raciones extras** | ✅ Permitido (puede causar confusión) | ❌ Solo las configuradas en schedule |
| **Nomenclatura** | ❌ Mezclado "toma" y "ración" | ✅ Consistente: "ración" |
| **Flujo principal** | Confuso (3 lugares) | Claro: Dashboard para diario, /feeding para detalles |
| **Validación schedules** | ❌ No valida | ✅ Valida contra configuración |

---

## 📝 Issues a Crear

### Issue #66: Nomenclatura - Unificar "toma" → "ración" en UI

**Prioridad**: Alta
**Tipo**: Refactor
**Esfuerzo**: 1-2 horas

**Descripción**: Reemplazar todas las ocurrencias de "toma" por "ración" en strings de usuario (UI, errores, logs).

**Archivos**:
- `lib/schemas/meal-schedule.ts`
- `components/feeding/DailyBalanceCard.tsx`
- `app/dashboard/page.tsx`
- `lib/utils/portion-balance.ts`

### Issue #67: Dashboard - Permitir seleccionar alimento al editar ración

**Prioridad**: Alta
**Tipo**: Feature
**Esfuerzo**: 3-4 horas

**Descripción**: Agregar dropdown de alimentos en `MealCard` del dashboard para que el usuario pueda elegir qué alimento usó, eliminando el placeholder automático.

**Cambios**:
1. Pasar lista de `foods` al componente `DailyBalanceCard`
2. Agregar `<select>` en `MealCard`
3. Actualizar `updatePortionAmount()` para recibir `food_id`
4. Eliminar lógica de "primer alimento como placeholder"

### Issue #68: Validar portion_number contra pet_portion_schedules

**Prioridad**: Media
**Tipo**: Feature
**Esfuerzo**: 2-3 horas

**Descripción**: Al crear un feeding, validar que el `portion_number` calculado corresponde a una ración configurada en `pet_portion_schedules`. Prevenir creación de raciones "fantasma".

**Cambios**:
1. `createFeeding()`: Validar contra schedules
2. `createMultiPetFeeding()`: Validar contra schedules
3. Error claro: "Ración X no configurada para esta mascota"

### Issue #69: Simplificar flujo - Consolidar creación en Dashboard

**Prioridad**: Baja
**Tipo**: Epic / Refactor
**Esfuerzo**: 8-10 horas

**Descripción**: Rediseñar flujo principal para que Dashboard sea el punto central de registro diario, y `/feeding` solo para historial/edición avanzada.

**Sub-tareas**:
1. Mejorar UX de dashboard para registro rápido
2. Deprecar registro multi-mascota desde `/feeding`
3. Convertir `/feeding` en "Historial y Edición Avanzada"
4. Actualizar documentación de flujo

---

## 🚀 Orden de Implementación Recomendado

1. **Issue #66** (1-2h) - Quick win, mejora UX inmediata
2. **Issue #67** (3-4h) - Resuelve problema del placeholder
3. **Issue #68** (2-3h) - Previene inconsistencias de datos
4. **Issue #69** (8-10h) - Refactor grande, considerar post-MVP

**Total esfuerzo (sin #69)**: ~6-9 horas
**Total esfuerzo (con #69)**: ~14-19 horas

---

## 📚 Referencias

- **Issue #64**: Nomenclatura meals → portions (completado)
- **Issue #65**: Invertir lógica eaten/leftover (completado)
- **Baseline DB**: `database/migrations/20251109_000000_baseline_v1.0.0.sql`
- **Types autogenerados**: `types/database.generated.ts`

---

**Última actualización**: 12 de Noviembre de 2025
**Autor**: AI Assistant + Kava
**Estado**: Pendiente de revisión y aprobación
