# Pet SiKness · GitHub Copilot Instructions

**Pet SiKness** - Aplicación web de seguimiento de alimentación para mascotas con balance diario y metas nutricionales.

**Responder siempre en ESPAÑOL**

> 📚 Consulta los archivos `AGENTS.md` (nested) para reglas completas.
>
> - `AGENTS.md` · Reglas generales de proyecto
> - `app/AGENTS.md` · Código Next.js / React (App Router)
> - `database/AGENTS.md` · Migraciones PostgreSQL
> - `components/AGENTS.md` · UI compartida
> - `lib/AGENTS.md` · Helpers de servidor y acceso a DB
> - `types/AGENTS.md` · System de types y auto-generación

📚 **Migraciones**: [../database/README.md](../database/README.md)

📚 **Gestor de los entornos**: [../README.md](../README.md) - Sección "PM2 Process Management"
📚 **Gestión de la base de datos**: [../database/README.md](../database/README.md)
📚 **DB Baseline**: [../database/migrations/20250101_000000_baseline.sql](../database/migrations/20250101_000000_baseline.sql)

📚 **Tareas VS Code**: [../.vscode/tasks.json](../.vscode/tasks.json) - **16 tareas disponibles**
- 🎮 **PM2** (8 tareas): Iniciar/Detener/Reiniciar DEV y PROD
- 📊 **Monitoreo** (4 tareas): Ver logs (50 líneas o tiempo real), estado general
- 🏗️ **Build** (2 tareas): Build completo y build + deploy
- 🔄 **Types** (2 tareas): Regenerar automáticamente desde schema PostgreSQL

📚 **Scripts Disponibles**:
- `scripts/PM2_build_and_deploy_and_dev/` - Scripts PM2 (start, stop, status, clean logs)
- `scripts/generate-types.js` - Auto-generación de types desde PostgreSQL

---

## Sistema troncal a mantener funcional

### Conceptos del Dominio

1. **Household (Hogar)**: Unidad familiar que agrupa mascotas
2. **Pet (Mascota)**: Animal con perfil completo y meta diaria de comida
3. **Food (Alimento)**: Catálogo de alimentos con información nutricional
4. **Feeding (Alimentación)**: Registro de comida servida a una mascota
5. **Daily Summary**: Vista agregada del balance diario (comido vs meta)

### Flujo de Datos

1. **Perfil de Usuario**: OAuth Google → `profiles` table
2. **Hogar**: Usuario crea o se une a un hogar → `households`, `household_members`
3. **Mascotas**: Definir mascotas con meta diaria → `pets` (daily_food_goal_grams)
4. **Catálogo**: Crear alimentos con nutrición → `foods`
5. **Registro Diario**: Registrar comidas → `feedings`
6. **Balance**: Vista automática → `daily_feeding_summary` (eaten vs goal)

### Metas y Balance

- **Meta Diaria**: `pets.daily_food_goal_grams` (gramos por día)
- **Comido Real**: SUM de `feedings.amount_grams` por pet por día
- **Balance**: `(eaten / goal) * 100` → Bajo (<90%), Cumplido (90-110%), Sobre (>110%)
- **Indicadores Visuales**: 🔴 Bajo, 🟢 Cumplido, 🟡 Sobre

---

## Workflow guiado y uso de la aplicación

### 1. Registro o inicio de sesión

- Google OAuth 2.0 con NextAuth
- Creación automática de perfil en `profiles`

### 2. Gestión de Hogar

- Crear nuevo hogar o unirse a uno existente
- Cada usuario puede pertenecer a múltiples hogares
- Cambio de hogar activo desde UI

### 3. Gestión de Mascotas

- Crear perfil completo de mascota (nombre, especie, raza, peso, etc.)
- Definir meta diaria de alimento (`daily_food_goal_grams`)
- Editar perfil y ajustar meta según necesidad
- Listar todas las mascotas del hogar

### 4. Catálogo de Alimentos

- Registrar alimentos con información nutricional
- Datos: nombre, marca, tipo, proteína, grasa, calorías, etc.
- Búsqueda y filtrado por nombre/marca
- Editar y mantener catálogo actualizado

### 5. Registro de Alimentación

- Registrar cada comida servida (fecha, hora, mascota, alimento, cantidad)
- Calcular balance automático vs meta diaria
- Ver historial de alimentación por mascota
- Filtrar por fecha, mascota, alimento

### 6. Dashboard y Estadísticas

- Resumen diario por mascota (eaten vs goal)
- Indicadores visuales de balance (🔴🟢🟡)
- Gráficos de tendencia semanal/mensual
- Alertas de balance negativo
- Actividad reciente del hogar

---

## UI y UIX

1. Modo oscuro / claro (next-themes)
2. Diseño responsive (móvil vertical prioritario, tablet, desktop)
3. Navegación sencilla e intuitiva con tabs y topbar
4. Formularios con validación y feedback inmediato (zod + react-hook-form)
5. Uso de componentes accesibles (shadcn/ui + Radix UI)
6. Feedback visual para acciones (toasts, loaders)
7. Cards visuales por mascota con estado de balance
8. Calendario de alimentación con indicadores
9. Gráficos de tendencias (Chart.js o Recharts)
10. Consistencia visual y UX fluida
11. Accesibilidad (roles ARIA, labels, etc.)
12. Evitar redundancias y pasos innecesarios
13. Mensajes de error claros y útiles

---

## ⚠️ Política de ejecución en este repo

- **NO hacer build en producción** salvo petición explícita del usuario
- El servidor DEV está siempre encendido con recarga en caliente; usa las Tareas VS Code para reiniciarlo o ver los logs si es necesario
- Si necesitas reiniciar DEV o PROD, usa exclusivamente las tareas definidas (no ejecutes comandos manuales). Ver `.vscode/tasks.json`
- **✅ USAR MCPs Git/GitHub**: Para todas las operaciones git (commit, push, status, etc.)
- **❌ NO USAR `run_in_terminal` para Git**: Los comandos git SIEMPRE mediante MCPs
- Si algún elemento documentado resulta no ser cierto, editar actualizando al estado real o deprecar
- Documentar cualquier cambio en la estructura del proyecto o en las dependencias en los `AGENTS.md`
- `npm run lint` y `npm run typecheck` para validar compilación, **NO BUILD**
- ❌ **NUNCA usar Supabase MCPs** (proyecto usa PostgreSQL directo)
- ❌ **NUNCA usar Vercel MCPs** (deploy en servidor propio con PM2)
- ❌ **NUNCA aplicar migraciones desde la aplicación** (usar scripts dedicados)
- ❌ **NUNCA editar `database.generated.ts` manualmente** (auto-generado)

---

## 🔄 Sistema de Auto-generación de Types

**Estado**: ✅ **IMPLEMENTADO Y FUNCIONAL**

### TypeScript Types Autogenerados

Los types de base de datos se generan **automáticamente** desde el schema PostgreSQL usando `kysely-codegen`.

**Archivo generado**: `types/database.generated.ts`
- **Formato**: Kysely (interfaces TypeScript)
- **Source of truth**: Schema PostgreSQL
- **Mantenimiento**: ✅ CERO (100% automático)

### Regeneración Manual

```bash
# DEV
npm run types:generate:dev

# PROD
npm run types:generate:prod
```

**VS Code Tasks disponibles**:
- `🔄 Regenerar Types (DEV)`
- `🔄 Regenerar Types (PROD)`

### Beneficios

- ✅ Sincronización automática schema ↔ types
- ✅ Compilación TypeScript siempre limpia
- ✅ Cero mantenimiento manual
- ✅ JSDoc completo desde comentarios SQL

**Documentación completa**: `types/AGENTS.md`

---

## 🗄️ Sistema de Migraciones

### Estructura

```
database/
└── migrations/
    ├── 20250101_000000_baseline.sql
    └── [nuevas migraciones].sql
```

### Workflow

1. **Crear migración**: Archivo SQL con timestamp
2. **Aplicar a DEV**: 
   ```bash
   sudo -u postgres psql -d pet_sikness_dev -f database/migrations/YYYYMMDD_HHMMSS_descripcion.sql
   ```
3. **Regenerar types**: `npm run types:generate:dev`
4. **Verificar**: `npm run typecheck`
5. **Probar en aplicación**
6. **Aplicar a PROD** (con backup previo):
   ```bash
   sudo -u postgres pg_dump -d pet_sikness_prod > ~/backups/pet_prod_$(date +%Y%m%d_%H%M%S).sql
   sudo -u postgres psql -d pet_sikness_prod -f database/migrations/YYYYMMDD_HHMMSS_descripcion.sql
   npm run types:generate:prod
   ```

### Reglas Críticas

- ✅ **SIEMPRE** aplicar como `postgres` con `SET ROLE pet_owner;` para DDL
- ✅ **SIEMPRE** regenerar types tras migración
- ✅ **SIEMPRE** backup antes de aplicar a PROD
- ❌ **NUNCA** aplicar migraciones desde la aplicación
- ❌ **NUNCA** modificar datos en migraciones (solo estructura)

---

## 🏗️ Stack vigente

- Next.js 14+ (App Router, Server Actions/Client Components, React 18+)
- TypeScript estricto
- PostgreSQL nativo (Types, tables, views, triggers) ⚠️ **NO Supabase, NO Vercel**
- NextAuth con Google OAuth 2.0
- Tailwind CSS + shadcn/ui + Radix UI
- Servicios gestionados con PM2 en servidor propio
- next-themes (dark/light mode)
- kysely-codegen (auto-generación de types)

---

## ✅ Checklist al Implementar Nueva Funcionalidad

1. **Contexto de usuario**
   - Obtén el hogar activo con `getUserHouseholdId()` (desde `lib/auth.ts`)

2. **Alcance de datos**
   - **Filtra todas las consultas** por `household_id`

3. **Validación y resultado**
   - **Valida inputs con Zod** en Server Actions
   - Devuelve un **`Result`** consistente (`ok` / `fail`) según la validación

4. **Cambios de base de datos**
   - Si hay cambios de estructura, **crea una migración SQL**
   - Aplica a DEV primero, prueba, luego PROD

5. **Efectos secundarios de caché/rutas**
   - Tras mutaciones, ejecuta **`revalidatePath()`** en las rutas afectadas

6. **Calidad del código**
   - Mantén **typecheck** y **linters** en verde
   - **No hagas build de producción** salvo que se solicite explícitamente

7. **Tipos TypeScript**
   - Tras migración, **regenera types**: `npm run types:generate:dev`
   - Usa tipos de `types/database.generated.ts` (NUNCA editar manualmente)

8. **Operación y tareas**
   - Evita reinicios manuales: configura **tareas de VS Code** para PM2 y otros comandos repetibles

---

## Variables de entorno únicas

```bash
# .env.development.local
DATABASE_URL="postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_dev"
NEXTAUTH_URL="http://localhost:3002"
NEXTAUTH_SECRET="tu_secret_desarrollo"
GOOGLE_CLIENT_ID="64299271376-ahd769em9ot3fut2uejf6l4v9blqj0do.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"

# .env.production.local
DATABASE_URL="postgresql://pet_user:SiKPets2025Segur0@localhost:5432/pet_sikness_prod"
NEXTAUTH_URL="http://petsikness.com"
NEXTAUTH_SECRET="tu_secret_produccion"
GOOGLE_CLIENT_ID="64299271376-ahd769em9ot3fut2uejf6l4v9blqj0do.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="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"
```

**BASES DE DATOS:**

- **DEV**: `pet_sikness_dev` (puerto 5432, desarrollo)
- **PROD**: `pet_sikness_prod` (puerto 5432, producción)
- La aplicación se conecta a PostgreSQL usando `pet_user` (en DATABASE_URL)

**PM2 PUERTOS:**

- **DEV**: Puerto 3002 (proceso: `petsikness-dev`)
- **PROD**: Puerto 3003 (proceso: `petsikness-prod`)

Ambas bases de datos gestionadas mediante PM2 con scripts dedicados en `scripts/PM2_build_and_deploy_and_dev/`

---

## 🔧 Convenciones de Código

### Nombres y Estructura

- **Variables/Funciones**: `camelCase` → `getDailyFeedings`, `calculateBalance`
- **Componentes/Tipos**: `PascalCase` → `PetCard`, `FeedingForm`
- **Constantes globales**: `SCREAMING_SNAKE_CASE`
- **Rutas Next**: `kebab-case` → `/app/pets`, `/app/feeding`
- **SQL**: `snake_case` → `household_id`, `daily_food_goal_grams`
- **Tablas**: Plurales → `pets`, `foods`, `feedings`

### Archivos

- **Componentes**: `PascalCase.tsx` → `PetCard.tsx`
- **Hooks/utils**: `camelCase.ts` → `useToast.ts`
- **Acciones**: `actions.ts` por ruta
- **Esquemas Zod**: `schema.ts` junto al formulario

### Imports

- **Absolutos**: Usar alias `@/` (configurado en `tsconfig.json`)
- **Tipos**: `import type { ... } from '...'`
- **NO usar imports relativos ascendentes** (`../`)

### Server Actions (Patrón Obligatorio)

Usar helper `lib/result.ts`:

```typescript
export type Ok<T = unknown> = { ok: true; data?: T };
export type Fail = { ok: false; message: string; fieldErrors?: Record<string, string[]> };
export type Result<T = unknown> = Ok<T> | Fail;

export const ok = <T>(data?: T): Ok<T> => ({ ok: true, data });
export const fail = (message: string, fieldErrors?: Record<string, string[]>): Fail => ({
  ok: false,
  message,
  fieldErrors,
});
```

**Ejemplo de Server Action:**

```typescript
'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { ok, fail } from '@/lib/result';
import type { Result } from '@/lib/result';
import { requireHousehold } from '@/lib/auth';

const PetSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  species: z.string().min(1, 'Especie requerida'),
  daily_food_goal_grams: z.number().positive('Meta debe ser mayor a 0'),
});

export async function createPet(formData: FormData): Promise<Result> {
  // 1. Autenticación y contexto
  const context = await requireHousehold();
  if (!context.ok) {
    return fail(context.message);
  }
  const { householdId } = context;

  // 2. Validación
  const parsed = PetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }

  // 3. Lógica de negocio
  // await query('INSERT INTO pets ...', [householdId, ...]);

  // 4. Revalidación
  revalidatePath('/app/pets');
  return ok();
}
```

**Reglas**:

- Validación con `zod.safeParse` SIEMPRE
- Retornar `Promise<Result<T>>` con tipo explícito
- Usar `requireHousehold()` para auth + contexto de hogar
- `revalidatePath()` tras mutaciones exitosas
- NO lanzar excepciones (salvo errores no recuperables)

---

## 🔍 Testing

### Estrategia Pragmática

- **Unit (Vitest)**: Utilidades puras → `lib/format.ts`, helpers
- **Componentes críticos**: `PetForm`, `FeedingForm`, `DailySummary`
- **NO testear**: Integraciones PostgreSQL profundas (confiar en DB constraints)

### Qué testear

✅ Formateo de datos
✅ Cálculo de balance (eaten vs goal)
✅ Validación de formularios con Zod
✅ Server Actions (unit tests de lógica)

---

## 📚 Repositorio

- **Ubicación local**: `/home/kava/workspace/proyectos/PetSiKness/repo`
- **Branch principal**: `main`
- **Dominio**: petsikness.com (por configurar)

---

## 🎯 Fases de Desarrollo

### Fase 1: Setup Base ✅ COMPLETADA
- Infraestructura, DB, types, documentación

### Fase 2: CRUD Mascotas 📋 SIGUIENTE
- Listado, detalle, crear, editar, eliminar
- Formularios con validación Zod
- Components: PetCard, PetForm, PetList

### Fase 3: CRUD Alimentos 📋 PENDIENTE
- Catálogo con búsqueda
- Info nutricional completa
- Components: FoodCard, FoodForm, NutritionInfo

### Fase 4: Calendario Alimentación 📋 PENDIENTE
- Registro de comidas
- Cálculo balance diario
- Indicadores visuales
- Filtros y búsqueda

### Fase 5: Dashboard 📋 PENDIENTE
- Resumen general
- Métricas por mascota
- Gráficos de tendencia
- Alertas de balance

### Fase 6: Production Deployment 📋 PENDIENTE
- nginx, SSL, deploy definitivo

---

**🔥 ESTAS INSTRUCCIONES SON LA GUÍA PRINCIPAL DEL PROYECTO 🔥**

_Para detalles arquitectónicos completos, ver documentación en los archivos `AGENTS.md` (nested) de cada directorio._
