# Pet SiKness - AI Agent Instructions

Este archivo define las instrucciones para agentes de IA trabajando en el proyecto **Pet SiKness**.

**Proyecto**: Aplicación web de gestión alimentaria para mascotas
**Stack**: Next.js 14+ (App Router), TypeScript, PostgreSQL nativo, Tailwind CSS, shadcn/ui
**Deploy**: PM2 en servidor propio (NO Vercel, NO Supabase)
**Repositorio**: https://github.com/Kavalieri/PetSiKness
**Ubicación**: `/home/kava/workspace/proyectos/PetSiKness/repo`

---

## 📋 Instrucciones Específicas por Carpeta (Nested AGENTS.md)

Este proyecto usa **nested AGENTS.md files** (VS Code v1.105+):

- **`/AGENTS.md`** (este archivo) - Instrucciones generales del proyecto
- **`/app/AGENTS.md`** - Instrucciones específicas para código Next.js/React
- **`/database/AGENTS.md`** - Instrucciones para migraciones y schema PostgreSQL
- **`/lib/AGENTS.md`** - Helpers y utilidades del servidor
- **`/components/AGENTS.md`** - Componentes UI reutilizables
- **`/types/AGENTS.md`** - Tipos TypeScript y contratos

**Configuración requerida**: En `.vscode/settings.json`:

```json
{
  "chat.useNestedAgentsMdFiles": true
}
```

Cuando trabajes en una carpeta específica, **las instrucciones de su AGENTS.md tienen prioridad** sobre las generales.

---

## 🚨 REGLA #1: USAR HERRAMIENTAS CORRECTAS

**OBLIGATORIO** usar las herramientas apropiadas para cada tarea específica.

### 📝 **PARA EDICIÓN DE ARCHIVOS**: Built-in VS Code Tools

| ✅ SIEMPRE USAR                            | ❌ NUNCA USAR                  |
| ------------------------------------------ | ------------------------------ |
| `create_file` - Crear archivos nuevos      | MCPs para crear archivos       |
| `read_file` - Leer contenido               | MCPs para leer archivos        |
| `replace_string_in_file` - Editar archivos | MCPs para editar archivos      |
| `list_dir` - Listar directorios            | MCPs para navegación           |
| `file_search` - Buscar archivos            | MCPs para búsqueda de archivos |

### 🔄 **PARA OPERACIONES GIT**: MCPs Git OBLIGATORIOS

| ✅ SIEMPRE USAR MCP                      | ❌ NUNCA USAR                       |
| ---------------------------------------- | ----------------------------------- |
| `mcp_git_git_commit({ message: "..." })` | `run_in_terminal("git commit ...")` |
| `mcp_git_git_push()`                     | `run_in_terminal("git push")`       |
| `mcp_git_git_status()`                   | `run_in_terminal("git status")`     |
| `mcp_git_git_add({ files: "." })`        | `run_in_terminal("git add .")`      |

**Si el usuario dice "usa las herramientas correctas"**, significa que olvidaste esta regla. **Disculpate y corrígelo inmediatamente**.

---

## 🐾 Dominio del Proyecto: Pet Food Tracking

### Propósito

Sistema de gestión alimentaria para mascotas que permite:

- Registrar perfiles de mascotas con objetivos nutricionales
- Mantener catálogo de alimentos con información nutricional
- Llevar diario de alimentación con cantidades exactas
- Calcular balance diario (comido vs objetivo)
- Monitorear comportamiento alimentario y salud digestiva

### Conceptos Clave

**Household (Hogar)**: Familia de mascotas

- Grupo de usuarios que comparten mascotas
- Un usuario puede pertenecer a UN solo household
- Roles: `owner` (creador) y `member` (invitado)

**Pet (Mascota)**: Perfil individual de mascota

- Información física: especie, raza, peso, condición corporal
- Objetivo diario: `daily_food_goal_grams` (cantidad meta)
- Objetivo de comidas: `daily_meals_target` (frecuencia)
- Salud: alergias[], medicamentos[]
- Comportamiento: apetito, nivel de actividad

**Food (Alimento)**: Producto del catálogo

- Información nutricional completa (calorías, macros por 100g)
- Información de producto (marca, ingredientes, precio)
- Calidad: palatabilidad, digestibilidad
- Restricciones: especies aptas, rango de edad

**Feeding (Alimentación)**: Registro de comida

- Qué: food_id, pet_id
- Cuándo: feeding_date, feeding_time, meal_number
- **Cantidades (⚠️ CRÍTICO - Cambio de lógica 11/11/2025)**:
  - `amount_served_grams`: Lo que se sirve (BASE PARA META ✅)
  - `amount_eaten_grams`: Lo que come (tracking de consumo)
  - `amount_leftover_grams`: Sobra calculada (served - eaten)
- Comportamiento: appetite_rating, eating_speed
- Resultados digestivos: vómito, diarrea, calidad de heces

**⚠️ CAMBIO CRÍTICO DE LÓGICA DE NEGOCIO (11/11/2025)**:

- **Meta cumplida**: Basada en `amount_served_grams` (lo servido), NO en lo comido
- **Razón**: Control de porciones + documentar desperdicio
- **Sobrantes**: Métrica clave para equilibrar consumos por mascota
- **Comido**: Tracking secundario de consumo real

**Daily Summary (Resumen Diario)**: Vista agregada

- Total servido vs objetivo diario ⭐ (era "comido" antes)
- Porcentaje de cumplimiento basado en served
- Status: `under_target`, `met_target`, `over_target`
- Métricas adicionales: total_eaten, total_leftover

---

## 🔐 Base de Datos - PostgreSQL Nativo

**⚠️ IMPORTANTE**: Este proyecto usa PostgreSQL DIRECTO, NO Supabase

### Usuarios de Base de Datos

1. **`postgres`** (Superusuario PostgreSQL)

   - Administración del servidor PostgreSQL
   - Usado con `sudo -u postgres` (sin contraseña)

2. **`pet_user`** ⭐ (Usuario de la aplicación - PRINCIPAL)

   - Rol `LOGIN` de mínimos privilegios (NO superuser, NO createdb, NO createrole)
   - Privilegios: `SELECT, INSERT, UPDATE, DELETE` en tablas y `USAGE, SELECT` en secuencias
   - Password: `SiKPets2025Segur0`
   - Usado en:
     - Aplicación Next.js (DATABASE_URL en .env)
     - Queries manuales para debugging
     - Scripts de sincronización de datos (no estructura)

3. **`pet_owner`** (Rol NOLOGIN para DDL)
   - Tipo: `NOLOGIN` (no puede conectar directamente)
   - Propietario de TODOS los objetos de base de datos
   - Usado para: DDL/migraciones (CREATE, ALTER, DROP, funciones SECURITY DEFINER)
   - **Ejecución**: Conectarse como `postgres` y ejecutar `SET ROLE pet_owner;` dentro de migraciones

### Bases de Datos

- **DEV**: `pet_sikness_dev` (desarrollo local)
- **PROD**: `pet_sikness_prod` (producción con PM2)

### Acceso a Base de Datos

**Para consultas SQL usar la abstracción `query()`:**

```typescript
import { query } from "@/lib/db";

// Consulta simple
const result = await query(
  `SELECT * FROM pets WHERE household_id = $1 ORDER BY name`,
  [householdId]
);

// result.rows contiene los datos
const pets = result.rows;
```

**NO usar comandos psql directos desde el código. Usar `query()` en el código.**

📚 **Documentación completa**: [database/README.md](database/README.md)

---

## 🔄 Sistema de Auto-generación de Types

**Estado**: ✅ **Implementado y Funcional**

### TypeScript Types Autogenerados

Los types de base de datos se generan **automáticamente** desde el schema PostgreSQL usando `kysely-codegen`.

**Archivo generado**: `types/database.generated.ts`

- **Líneas**: ~140 (8 tablas + enums)
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

### Uso en Código

```typescript
// Importar types auto-generados
import type { Pets, Foods, Feedings } from "@/types/database.generated";

// Usar en funciones
async function getPets(householdId: string): Promise<Pets[]> {
  const result = await query<Pets>(
    `SELECT * FROM pets WHERE household_id = $1`,
    [householdId]
  );
  return result.rows;
}
```

---

## 🔄 Sistema de Migraciones

### Estructura de Directorios

```
database/
├── migrations/
│   └── 20251109_000000_baseline_v1.0.0.sql  # Baseline inicial
└── README.md
```

**Sistema Simplificado**: Por ser proyecto nuevo, no tenemos el sistema completo de desarrollo/tested/applied. Todas las migraciones van en `database/migrations/`.

### Crear Nueva Migración

```bash
# Crear archivo con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
touch database/migrations/${TIMESTAMP}_descripcion.sql
```

### Aplicar Migración

```bash
# Conectarse como postgres y aplicar
sudo -u postgres psql -d pet_sikness_dev -f database/migrations/ARCHIVO.sql

# Para PROD (con backup previo OBLIGATORIO)
sudo -u postgres pg_dump pet_sikness_prod > ~/backups/prod_$(date +%Y%m%d_%H%M%S).sql
sudo -u postgres psql -d pet_sikness_prod -f database/migrations/ARCHIVO.sql
```

### Regenerar Types Después de Migración

```bash
# Siempre regenerar types tras cambios de schema
npm run types:generate:dev
```

---

## ⚙️ Gestión de Procesos - PM2

### Procesos del Sistema

**Pet SiKness**:

- **DEV**: `petsikness-dev` (puerto 3002)
- **PROD**: `petsikness-prod` (puerto 3003)

**CuentasSiK** (hermano independiente):

- **DEV**: `cuentassik-dev` (puerto 3001)
- **PROD**: `cuentassik-prod` (puerto 3000)

### Comandos PM2 Disponibles

```bash
# Iniciar DEV
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-start.sh

# Detener DEV
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-stop.sh

# Ver estado
./scripts/PM2_build_and_deploy_and_dev/pm2-status.sh

# Iniciar PROD
./scripts/PM2_build_and_deploy_and_dev/pm2-prod-start.sh

# Detener PROD
./scripts/PM2_build_and_deploy_and_dev/pm2-prod-stop.sh
```

### Tareas VSCode

**Acceso**: `Ctrl+Shift+P` → `Tasks: Run Task`

- `🟢 DEV: Iniciar`
- `🔴 DEV: Detener`
- `📊 Estado PM2`
- `🔄 Regenerar Types (DEV)`
- `🔄 Regenerar Types (PROD)`

---

## 🔧 Convenciones de Código

### Nomenclatura

- **Variables/Funciones**: `camelCase` → `getDailyFeedings`, `createPet`
- **Componentes/Tipos**: `PascalCase` → `PetForm`, `Pet`
- **Constantes**: `SCREAMING_SNAKE_CASE`
- **Rutas Next**: `kebab-case` → `/app/pets`
- **SQL**: `snake_case` → `household_id`, `feeding_date`
- **Tablas**: Plurales → `pets`, `foods`, `feedings`

### Imports

- Usar alias `@/` (configurado en `tsconfig.json`)
- Tipos: `import type { ... } from '...'`
- NO usar imports relativos ascendentes (`../`)

### Server Actions (Patrón Obligatorio)

Usar helper `lib/result.ts`:

```typescript
export type Ok<T = unknown> = { ok: true; data?: T };
export type Fail = {
  ok: false;
  message: string;
  fieldErrors?: Record<string, string[]>;
};
export type Result<T = unknown> = Ok<T> | Fail;

export const ok = <T>(data?: T): Ok<T> => ({ ok: true, data });
export const fail = (
  message: string,
  fieldErrors?: Record<string, string[]>
): Fail => ({
  ok: false,
  message,
  fieldErrors,
});
```

**Ejemplo:**

```typescript
"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { ok, fail } from "@/lib/result";
import type { Result } from "@/lib/result";

const PetSchema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  daily_food_goal_grams: z.number().positive(),
});

export async function createPet(formData: FormData): Promise<Result> {
  const parsed = PetSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return fail("Datos inválidos", parsed.error.flatten().fieldErrors);
  }

  // Lógica de negocio...

  revalidatePath("/app/pets");
  return ok();
}
```

**Reglas:**

- Validación con `zod.safeParse` SIEMPRE
- Retornar `Promise<Result<T>>` con tipo explícito
- `revalidatePath()` tras mutaciones exitosas
- NO lanzar excepciones (salvo errores no recuperables)

---

## ✅ Checklist al Implementar Nueva Funcionalidad

1. **Contexto de usuario**

   - Obtén el hogar activo con `getUserHouseholdId()`

2. **Alcance de datos**

   - Filtra todas las consultas por `household_id`

3. **Validación y resultado**

   - Valida inputs con Zod en Server Actions
   - Devuelve un `Result` consistente (`ok` / `fail`)

4. **Cambios de base de datos**

   - Si hay cambios de estructura, crea una migración en `database/migrations/`
   - Regenera types con `npm run types:generate:dev`

5. **Efectos secundarios de caché/rutas**

   - Tras mutaciones, ejecuta `revalidatePath()` en las rutas afectadas

6. **Calidad del código**

   - Mantén `typecheck` en verde: `npm run typecheck`
   - NO hagas build de producción salvo petición explícita

7. **Entornos y despliegue**
   - Prueba en DEV antes de aplicar a PROD

---

## ⚠️ CAMBIO CRÍTICO: Lógica de Metas (11 Noviembre 2025)

**Breaking Change en sistema de cumplimiento de objetivos nutricionales**

### Lógica ANTERIOR (❌ DEPRECADA)

- Meta cumplida si mascota **comió** suficiente (`amount_eaten_grams >= daily_goal`)
- Problema: No diferencia entre "no servido" y "no comido"
- No documentaba desperdicio de alimento

### Lógica ACTUAL (✅ VIGENTE desde 11/11/2025)

**Meta basada en cantidad SERVIDA, no comida**

```typescript
// Cumplimiento de meta
const goalAchievement = (amount_served_grams / daily_food_goal_grams) * 100;
const status =
  goalAchievement >= 90
    ? "completed"
    : goalAchievement >= 70
    ? "partial"
    : "delayed";

// Sobrante = métrica clave
const leftover = amount_served_grams - amount_eaten_grams;
```

### Razones del Cambio

1. **Control de porciones**: Meta = "sirvió lo que debía servir"
2. **Documentar desperdicio**: Sobrantes indican problemas de apetito/palatabilidad
3. **Equilibrio**: Usuario puede ajustar porciones según sobrantes históricos
4. **Separación clara**:
   - `served` = Control de alimentador (lo servido)
   - `eaten` = Comportamiento de mascota (lo consumido)
   - `leftover` = Indicador de ajuste necesario

### Impacto en Código

**Backend** (`lib/utils/meal-balance.ts`):

- `MealBalance.served_grams`: Cantidad servida (para meta)
- `MealBalance.eaten_grams`: Cantidad comida (tracking)
- `MealBalance.leftover_grams`: Calculado (served - eaten)
- `MealBalance.percentage`: `(served / expected) * 100` ⚠️

**API** (`app/dashboard/actions.ts`):

- Queries incluyen `amount_served_grams` obligatoriamente
- `FeedingRecord` requiere served + eaten

**UI** (`components/feeding/DailyBalanceCard.tsx`):

- Progress bar: "Servido vs Meta" (antes era "Comido vs Meta")
- Visible: Servido, Comido, Sobra
- Colores: Sobra en amarillo si > 0

### Migración de Datos

**NO requiere migración** - Columnas ya existían en BD:

```sql
-- Tabla feedings (desde baseline v1.0.0)
amount_served_grams INTEGER NOT NULL,
amount_eaten_grams INTEGER NOT NULL,
amount_leftover_grams INTEGER GENERATED ALWAYS AS
  (amount_served_grams - amount_eaten_grams) STORED
```

Solo cambió la **interpretación** en lógica de negocio.

---

## 🔴 PROHIBICIONES

❌ **NUNCA usar Supabase MCPs** (proyecto usa PostgreSQL directo)
❌ **NUNCA usar Vercel MCPs** (deploy en servidor propio con PM2)
❌ **NUNCA aplicar migraciones desde la aplicación** (usar scripts psql dedicados)
❌ **NUNCA usar `run_in_terminal` para Git** (usar `mcp_git_*`)
❌ **NUNCA asumir un solo hogar** (sistema multi-hogar activo)
❌ **NUNCA modificar datos en archivos de migración** (solo estructura DDL)
❌ **NUNCA tocar CuentasSiK** (proyecto hermano completamente separado)

---

## 📚 Referencias Clave

- **Setup completo**: [docs/ESTADO_PROYECTO.md](docs/ESTADO_PROYECTO.md)
- **Plan Fase 2**: [docs/FASE_2_PLAN.md](docs/FASE_2_PLAN.md)
- **Schema de BD**: [database/README.md](database/README.md)
- **Tasks VSCode**: [.vscode/tasks.json](.vscode/tasks.json)
- **Proyecto hermano**: CuentasSiK en `/home/kava/workspace/proyectos/CuentasSiK/repo`

---

## 🎯 Roadmap de Desarrollo

### Fase 1: Setup Base ✅ COMPLETADO

- [x] PostgreSQL setup (roles, bases de datos, permisos)
- [x] Schema baseline (7 tablas + 1 vista)
- [x] Configuración Next.js
- [x] PM2 ecosystem
- [x] Auth con Google OAuth
- [x] Auto-generación de types
- [x] Servidor DEV funcional

### Fase 2: CRUD Mascotas ✅ COMPLETADO

- [x] Listado de mascotas (`/app/pets/page.tsx`)
- [x] Formulario crear/editar mascota
- [x] Vista detalle mascota
- [x] Server actions (crear, editar, eliminar)
- [x] Validación con Zod

### Fase 3: CRUD Alimentos ✅ COMPLETADO

- [x] Catálogo de alimentos (`/app/foods/page.tsx`)
- [x] Formulario crear/editar alimento
- [x] Vista detalle alimento con info nutricional
- [x] Búsqueda y filtros
- [x] Server actions

### Fase 4: Calendario de Alimentación ✅ COMPLETADO

- [x] Vista diaria de alimentaciones (`/app/feeding/page.tsx`)
- [x] Formulario registro de comida
- [x] Cálculo de balance (comido vs objetivo)
- [x] Indicadores visuales (bajo/cumplido/sobre)
- [x] Filtros por mascota, fecha, alimento

### Fase 4.5: Navegación Temporal y UX ✅ COMPLETADO

- [x] TemporalNavigator (día/semana/mes/año)
- [x] Dashboard con contexto temporal
- [x] DateRangePicker con presets
- [x] Filtro de rango de fechas en Feeding
- [x] Agrupación visual por fecha
- [x] Registro multi-mascota
- [x] Documentación completa

### Fase 5: Dashboard y Analytics ✅ COMPLETADO

- [x] Dashboard principal (`/app/dashboard/page.tsx`)
- [x] Cards de resumen por mascota
- [x] Balance general del hogar
- [x] Alertas de balance negativo
- [x] Actividad reciente
- [x] Stats cards con métricas clave

### Fase 6: Production Deployment 📋 PENDIENTE

- [ ] Configurar nginx para petsikness.sikwow.com
- [ ] SSL certificate (Let's Encrypt)
- [ ] Build producción optimizado
- [ ] PM2 PROD monitoring
- [ ] Backup strategy automatizado
- [ ] Health checks y alertas

### Fase 7: Advanced Analytics 📋 OPCIONAL (Futuro)

- [ ] Period comparison (actual vs anterior)
- [ ] Charts con Chart.js (tendencias, heatmaps)
- [ ] Export CSV/Excel
- [ ] Predictive insights

---

**🔥 ESTAS INSTRUCCIONES SON LA GUÍA PRINCIPAL DEL PROYECTO 🔥**

_Para detalles arquitectónicos completos, ver documentación en cada directorio y sus respectivos `AGENTS.md` (nested)._
