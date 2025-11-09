# Types - Instrucciones Específicas

> **Contexto**: Parte de Pet SiKness (ver `/AGENTS.md` principal)
> **Área**: Sistema de Tipos TypeScript y Auto-generación

---

## 📂 **ESTRUCTURA DEL DIRECTORIO**

```
types/
├── database.generated.ts   # ⭐ Auto-generado desde PostgreSQL (NO EDITAR)
├── next-auth.d.ts          # Extensiones de NextAuth
└── [custom]/               # Types custom (si es necesario)
```

---

## ⚙️ **database.generated.ts - TYPES AUTO-GENERADOS**

### **⚠️ CRÍTICO: NO EDITAR MANUALMENTE**

Este archivo se genera automáticamente desde el schema de PostgreSQL usando `kysely-codegen`.

**Contenido**:
- Interfaces TypeScript para TODAS las tablas
- Enums de PostgreSQL
- Tipos de columnas exactos
- JSDoc desde comentarios SQL

### Regeneración Automática

**Cuándo se regenera**:
- Al aplicar una migración (automático)
- Al ejecutar `npm run types:generate:dev` o `npm run types:generate:prod`

**Nunca modificar manualmente**. Si necesitas cambiar types:
1. Modificar schema PostgreSQL (migración)
2. Regenerar types

### Uso en Código

```typescript
// ✅ BIEN: Importar tipos generados
import type { Pets, Foods, Feedings } from '@/types/database.generated';

// Usar en funciones
async function getPet(id: string): Promise<Pets | null> {
  const result = await query<Pets>('SELECT * FROM pets WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Usar en componentes
interface PetCardProps {
  pet: Pets;
}

export function PetCard({ pet }: PetCardProps) {
  return <div>{pet.name}</div>;
}
```

### Tipos Disponibles (Tablas)

Cada tabla tiene una interface correspondiente en `PascalCase`:

| Tabla SQL | Tipo TypeScript | Uso |
|-----------|-----------------|-----|
| `profiles` | `Profiles` | Usuario OAuth |
| `households` | `Households` | Familia de mascotas |
| `household_members` | `HouseholdMembers` | Membresía |
| `pets` | `Pets` | Perfil de mascota |
| `foods` | `Foods` | Alimento en catálogo |
| `feedings` | `Feedings` | Registro de alimentación |
| `_migrations` | `Migrations` | Control de migraciones |

**Vistas**:

| Vista SQL | Tipo TypeScript | Uso |
|-----------|-----------------|-----|
| `daily_feeding_summary` | `DailyFeedingSummary` | Resumen diario agregado |

### Estructura de Types Generados

```typescript
// Ejemplo: Pets
export interface Pets {
  id: string;                          // UUID
  household_id: string;                // UUID
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;           // Date as ISO string
  gender: "male" | "female" | "unknown" | null;
  weight_kg: string | null;            // DECIMAL as string
  body_condition: "underweight" | "ideal" | "overweight" | "obese" | null;
  daily_food_goal_grams: number;       // INTEGER
  daily_meals_target: number | null;
  health_notes: string | null;
  allergies: string[] | null;          // TEXT[] as string[]
  medications: string[] | null;
  appetite: "poor" | "normal" | "good" | "excellent" | null;
  activity_level: "sedentary" | "low" | "moderate" | "high" | "very_high" | null;
  created_at: Date;                    // TIMESTAMPTZ as Date
  updated_at: Date;
}
```

### ❌ **ANTI-PATRONES**

```typescript
// ❌ MAL: Editar database.generated.ts manualmente
// database.generated.ts
export interface Pets {
  id: string;
  name: string;
  new_field: string; // ¡NO! Se perderá en la próxima regeneración
}

// ❌ MAL: Duplicar definiciones de tipos
// types/custom.ts
export interface Pet {  // Duplica Pets de database.generated.ts
  id: string;
  name: string;
}

// ❌ MAL: No usar tipos generados
const pet: any = result.rows[0]; // Pierde seguridad de tipos

// ❌ MAL: Asumir estructura sin verificar tipo
const pet = result.rows[0];
console.log(pet.nombre); // Error: propiedad es 'name', no 'nombre'
```

### ✅ **PATRONES CORRECTOS**

```typescript
// ✅ BIEN: Importar y usar tipos generados
import type { Pets } from '@/types/database.generated';

const result = await query<Pets>('SELECT * FROM pets WHERE id = $1', [id]);
const pet: Pets | undefined = result.rows[0];

// ✅ BIEN: Type narrowing
if (pet) {
  console.log(pet.name); // TypeScript sabe que pet no es undefined
}

// ✅ BIEN: Partial types para updates
type PetUpdate = Partial<Pick<Pets, 'name' | 'weight_kg' | 'daily_food_goal_grams'>>;

const updates: PetUpdate = {
  weight_kg: "5.2",
  daily_food_goal_grams: 250,
};

// ✅ BIEN: Types en Server Actions
export async function createPet(data: CreatePetInput): Promise<Result<Pets>> {
  const result = await query<Pets>('INSERT INTO pets (...) VALUES (...) RETURNING *', [...]);
  return ok(result.rows[0]);
}
```

---

## 🔄 **REGENERACIÓN DE TYPES**

### Manual

```bash
# Regenerar desde DEV
npm run types:generate:dev

# Regenerar desde PROD
npm run types:generate:prod
```

### Script Interno

El script usa `kysely-codegen` para introspección del schema:

```bash
# scripts/migrations/generate-types.js
npx kysely-codegen \
  --dialect postgres \
  --out-file types/database.generated.ts
```

### Verificación Post-Regeneración

```bash
# Verificar que compila sin errores
npm run typecheck

# Output esperado: "No errors found"
```

### ⚠️ **Cuándo Regenerar**

**OBLIGATORIO regenerar tras**:
1. Aplicar migración que modifica schema
2. Añadir/eliminar tabla
3. Añadir/eliminar columna
4. Cambiar tipo de columna
5. Añadir/modificar enum

**NO necesario regenerar tras**:
- Cambios en datos (INSERT, UPDATE, DELETE)
- Cambios en `.env` files
- Cambios en código TypeScript

---

## 🔧 **next-auth.d.ts - EXTENSIONES DE NEXTAUTH**

### Propósito

Extender los tipos de NextAuth para incluir campos custom del perfil.

### Contenido Actual

```typescript
// types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      profile_id: string;      // UUID del profile
      display_name?: string;   // Nombre de display
      avatar_url?: string;     // URL del avatar
    } & DefaultSession['user'];
  }
}
```

### Uso

```typescript
import { getServerSession } from 'next-auth';

const session = await getServerSession();

if (session?.user) {
  console.log(session.user.profile_id);    // UUID
  console.log(session.user.email);         // Email (de DefaultSession)
  console.log(session.user.display_name);  // Nombre custom
  console.log(session.user.avatar_url);    // Avatar custom
}
```

### Modificar Extensiones

Si necesitas añadir más campos a la sesión:

```typescript
// 1. Modificar types/next-auth.d.ts
declare module 'next-auth' {
  interface Session {
    user: {
      profile_id: string;
      display_name?: string;
      avatar_url?: string;
      household_id?: string; // Nuevo campo
    } & DefaultSession['user'];
  }
}

// 2. Modificar callback en app/api/auth/[...nextauth]/route.ts
session: async ({ session, token }) => {
  // ...código existente...
  session.user.household_id = profile.household_id; // Añadir lógica
  return session;
}
```

---

## 📝 **TYPES CUSTOM (Si es necesario)**

### Cuándo Crear Types Custom

**SOLO SI**:
- No existen en `database.generated.ts`
- Son para lógica de negocio específica
- Son DTOs (Data Transfer Objects)
- Son tipos de utilidad

### Ubicación

Crear archivos en `types/` con nombres descriptivos:
- `types/dtos.ts` - DTOs para APIs
- `types/forms.ts` - Tipos para formularios
- `types/utils.ts` - Tipos de utilidad

### Ejemplos

**DTOs**:

```typescript
// types/dtos.ts
import type { Pets, Foods } from './database.generated';

// DTO para crear mascota (subset de Pets)
export interface CreatePetDTO {
  name: string;
  species: string;
  breed?: string;
  birth_date?: string;
  daily_food_goal_grams: number;
}

// DTO para respuesta con datos relacionados
export interface PetWithStats extends Pets {
  total_feedings: number;
  avg_daily_intake: number;
}
```

**Formularios**:

```typescript
// types/forms.ts

// Tipo para estado de formulario
export interface FeedingFormState {
  petId: string;
  foodId: string;
  amountServed: string;
  amountEaten: string;
  errors: {
    amountServed?: string;
    amountEaten?: string;
  };
}
```

**Utilidad**:

```typescript
// types/utils.ts

// Helper type para hacer campos requeridos
export type RequireFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Helper type para hacer campos opcionales
export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Uso:
import type { Pets } from './database.generated';
type PetWithRequiredBreed = RequireFields<Pets, 'breed'>;
```

---

## ✅ **CHECKLIST AL TRABAJAR CON TYPES**

1. ✅ **NUNCA editar `database.generated.ts` manualmente**

2. ✅ **Regenerar types tras migraciones**:
   ```bash
   npm run types:generate:dev
   npm run typecheck
   ```

3. ✅ **Usar tipos generados en queries**:
   ```typescript
   const result = await query<Pets>('SELECT * FROM pets WHERE id = $1', [id]);
   ```

4. ✅ **Importar con `type`**:
   ```typescript
   import type { Pets } from '@/types/database.generated';
   ```

5. ✅ **Verificar compilación**:
   ```bash
   npm run typecheck
   ```

6. ✅ **Types custom solo cuando sea necesario**:
   - No duplicar tipos de `database.generated.ts`
   - Crear en archivos separados con nombres descriptivos

---

## 🚫 **PROHIBICIONES**

- ❌ NUNCA editar `database.generated.ts` manualmente
- ❌ NUNCA duplicar tipos que ya existen en `database.generated.ts`
- ❌ NUNCA usar `any` (usar `unknown` si es necesario y hacer type narrowing)
- ❌ NUNCA olvidar regenerar types tras migración
- ❌ NUNCA hacer commit de `database.generated.ts` sin verificar compilación

---

## 🔍 **TROUBLESHOOTING**

### Error: "Property does not exist on type"

**Causa**: Types desactualizados tras migración

**Solución**:
```bash
npm run types:generate:dev
npm run typecheck
```

### Error: "Cannot find module '@/types/database.generated'"

**Causa**: Archivo no generado

**Solución**:
```bash
npm run types:generate:dev
```

### Error: Types no coinciden con DB real

**Causa**: Aplicaste migración pero no regeneraste types

**Solución**:
```bash
npm run types:generate:dev
npm run typecheck
```

---

## 📚 **REFERENCIAS**

- **kysely-codegen**: https://github.com/RobinBlomberg/kysely-codegen
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/handbook/intro.html
- **NextAuth Types**: https://next-auth.js.org/getting-started/typescript

---

**🔥 ESTAS SON LAS REGLAS PARA TODO EL SISTEMA DE TIPOS 🔥**
