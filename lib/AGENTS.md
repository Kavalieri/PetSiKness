# Lib - Instrucciones Específicas

> **Contexto**: Parte de Pet SiKness (ver `/AGENTS.md` principal)
> **Área**: Helpers, Utilities y Bibliotecas Compartidas

---

## 📂 **ESTRUCTURA DEL DIRECTORIO**

```
lib/
├── db.ts               # ⭐ Acceso a PostgreSQL (query, transaction)
├── auth.ts             # ⭐ Autenticación y contexto de usuario
├── result.ts           # ⭐ Tipo Result para Server Actions
├── format.ts           # Formateo (fechas, números, texto)
├── date.ts             # Manipulación de fechas
├── utils.ts            # Utilidades generales (cn, etc.)
└── __tests__/          # Tests unitarios (Vitest)
```

---

## 🗄️ **db.ts - Acceso a PostgreSQL**

### **⚠️ IMPORTANTE: Uso EXCLUSIVO de `query()` en Código**

**Este archivo es la ÚNICA forma de acceder a PostgreSQL desde el código TypeScript.**

### Exports Principales

#### **1. `query(sql, params)`** ⭐ MÁS USADO

**Uso**: Queries parametrizadas simples (SELECT, INSERT, UPDATE, DELETE)

```typescript
import { query } from '@/lib/db';

// SELECT simple
const result = await query(
  'SELECT * FROM pets WHERE household_id = $1',
  [householdId]
);
const pets = result.rows; // Pet[]

// SELECT con JOIN
const result = await query(`
  SELECT f.*, p.name as pet_name, fo.name as food_name
  FROM feedings f
  JOIN pets p ON p.id = f.pet_id
  JOIN foods fo ON fo.id = f.food_id
  WHERE f.household_id = $1
    AND f.feeding_date = $2
  ORDER BY f.feeding_time DESC
`, [householdId, feedingDate]);

// INSERT con RETURNING
const result = await query(`
  INSERT INTO pets (household_id, name, species, daily_food_goal_grams)
  VALUES ($1, $2, $3, $4)
  RETURNING *
`, [householdId, name, species, goalGrams]);
const newPet = result.rows[0];

// UPDATE
const result = await query(`
  UPDATE pets
  SET daily_food_goal_grams = $1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = $2 AND household_id = $3
  RETURNING *
`, [newGoal, petId, householdId]);

// DELETE
const result = await query(`
  DELETE FROM pets
  WHERE id = $1 AND household_id = $2
  RETURNING id
`, [petId, householdId]);
```

**Características**:
- Conexiones del pool (max 20)
- Automáticamente libera la conexión tras la query
- Retorna `QueryResult<T>` con `.rows` array
- Placeholders: `$1, $2, $3...`

#### **2. `transaction(callback)`** (Para Operaciones Múltiples)

**Uso**: Múltiples queries que deben ejecutarse en bloque (todo o nada)

```typescript
import { transaction } from '@/lib/db';

const result = await transaction(async (client) => {
  // 1. Crear feeding record
  const feeding = await client.query(`
    INSERT INTO feedings (household_id, pet_id, food_id, feeding_date, amount_served_grams, amount_eaten_grams)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *
  `, [householdId, petId, foodId, date, served, eaten]);

  // 2. Actualizar daily_meals_count en pets (ejemplo)
  await client.query(`
    UPDATE pets
    SET daily_meals_count = daily_meals_count + 1
    WHERE id = $1
  `, [petId]);

  return feeding.rows[0];
});

// Si cualquier query falla, se hace rollback automático
```

**Características**:
- BEGIN automático
- COMMIT si todo OK
- ROLLBACK si hay error
- El `client` debe usarse para todas las queries dentro del callback

#### **3. `pool`** (Pool de Conexiones - Raro Uso Directo)

**Uso**: Solo si necesitas control manual del pool (muy raro)

```typescript
import { pool } from '@/lib/db';

// Verificar estado del pool
const stats = pool.totalCount; // Total connections
const idle = pool.idleCount;   // Idle connections
const waiting = pool.waitingCount; // Waiting queries
```

### Configuración del Pool

```typescript
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,                    // Máximo 20 conexiones
  idleTimeoutMillis: 30000,   // Cerrar idle después de 30s
  connectionTimeoutMillis: 2000, // Timeout para obtener conexión
});
```

### ❌ **ANTI-PATRONES - NO HACER**

```typescript
// ❌ MAL: No usar psql desde código
import { exec } from 'child_process';
exec('psql -U pet_user -d pet_sikness_dev -c "SELECT ..."');

// ❌ MAL: No construir SQL con concatenación
const sql = `SELECT * FROM pets WHERE id = '${petId}'`; // SQL Injection!
await query(sql);

// ❌ MAL: No usar pg.Client directamente sin pool
import { Client } from 'pg';
const client = new Client({ ... });
await client.connect();

// ❌ MAL: No olvidar parámetros en WHERE household_id
const result = await query(`SELECT * FROM pets WHERE id = $1`, [petId]);
// Falta: AND household_id = $2
```

### ✅ **PATRONES CORRECTOS**

```typescript
// ✅ BIEN: Queries parametrizadas
await query('SELECT * FROM pets WHERE id = $1 AND household_id = $2', [petId, householdId]);

// ✅ BIEN: SIEMPRE filtrar por household_id
await query('SELECT * FROM feedings WHERE pet_id = $1 AND household_id = $2', [petId, householdId]);

// ✅ BIEN: Usar RETURNING para obtener datos tras INSERT/UPDATE
const result = await query('INSERT INTO pets (...) VALUES (...) RETURNING *', [...]);
const newPet = result.rows[0];

// ✅ BIEN: Usar transaction para operaciones múltiples
await transaction(async (client) => {
  await client.query('INSERT INTO feedings ...', [...]);
  await client.query('UPDATE pets ...', [...]);
});
```

---

## 🔐 **auth.ts - Autenticación y Contexto**

### Exports Principales

#### **1. `getCurrentUser()`** ⭐ MÁS USADO

**Uso**: Obtener el usuario actual en Server Components/Actions

```typescript
import { getCurrentUser } from '@/lib/auth';

export default async function Page() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return <div>Hola {user.display_name || user.email}</div>;
}
```

**Retorna**:
```typescript
{
  profile_id: string;    // UUID del profile
  email: string;
  display_name: string | null;
  avatar_url: string | null;
} | null
```

#### **2. `getUserHouseholdId()`** ⭐ CRÍTICO

**Uso**: Obtener el household_id del usuario actual (para filtrar queries)

```typescript
import { getUserHouseholdId } from '@/lib/auth';
import { query } from '@/lib/db';

export default async function PetsPage() {
  const householdId = await getUserHouseholdId();
  
  if (!householdId) {
    return <div>No perteneces a ningún hogar. <Link href="/household/join">Unirse</Link></div>;
  }

  // SIEMPRE filtrar por household_id
  const result = await query(
    'SELECT * FROM pets WHERE household_id = $1 ORDER BY name',
    [householdId]
  );

  return <PetList pets={result.rows} />;
}
```

**Retorna**: `string | null` (UUID del household)

#### **3. `requireAuth()`** (Redirect si No Autenticado)

**Uso**: En Server Components/Actions que requieren autenticación

```typescript
import { requireAuth } from '@/lib/auth';

export default async function ProtectedPage() {
  await requireAuth(); // Redirect a /login si no autenticado

  // Si llega aquí, usuario está autenticado
  const user = await getCurrentUser(); // Nunca null aquí
  
  return <div>Área protegida</div>;
}
```

**Comportamiento**:
- Si no hay sesión: `redirect('/login')`
- Si hay sesión: No hace nada (continúa)

#### **4. `requireHousehold()`** (Redirect si No Tiene Household)

**Uso**: En páginas que requieren que el usuario pertenezca a un hogar

```typescript
import { requireHousehold } from '@/lib/auth';

export default async function PetsPage() {
  const householdId = await requireHousehold(); // Redirect a /household/join si no tiene
  
  // Si llega aquí, householdId nunca es null
  const result = await query(
    'SELECT * FROM pets WHERE household_id = $1',
    [householdId]
  );
  
  return <PetList pets={result.rows} />;
}
```

**Comportamiento**:
- Si no autenticado: `redirect('/login')`
- Si autenticado pero sin household: `redirect('/household/join')`
- Si tiene household: Retorna `householdId` (string)

### ❌ **ANTI-PATRONES**

```typescript
// ❌ MAL: No verificar sesión en Server Actions
'use server';
export async function deletePet(petId: string) {
  // Falta: await requireAuth();
  await query('DELETE FROM pets WHERE id = $1', [petId]); // ¡Cualquiera puede borrar!
}

// ❌ MAL: No filtrar por household_id
const user = await getCurrentUser();
const pets = await query('SELECT * FROM pets'); // ¡Retorna TODAS las mascotas de TODOS los hogares!

// ❌ MAL: Asumir que getCurrentUser() no es null sin verificar
const user = await getCurrentUser();
console.log(user.email); // TypeError: Cannot read property 'email' of null

// ❌ MAL: No usar requireHousehold cuando se necesita
const householdId = await getUserHouseholdId(); // Puede ser null
await query('SELECT * FROM pets WHERE household_id = $1', [householdId]); // Error si null
```

### ✅ **PATRONES CORRECTOS**

```typescript
// ✅ BIEN: Server Action con autenticación y contexto
'use server';
import { requireHousehold } from '@/lib/auth';
import { query } from '@/lib/db';

export async function deletePet(petId: string): Promise<Result> {
  const householdId = await requireHousehold(); // Verifica auth + household
  
  // Siempre filtrar por household_id (seguridad)
  const result = await query(
    'DELETE FROM pets WHERE id = $1 AND household_id = $2 RETURNING id',
    [petId, householdId]
  );
  
  if (result.rowCount === 0) {
    return fail('Mascota no encontrada o no tienes permisos');
  }
  
  revalidatePath('/pets');
  return ok();
}

// ✅ BIEN: Verificar null antes de usar
const user = await getCurrentUser();
if (!user) {
  redirect('/login');
}
console.log(user.email); // Seguro

// ✅ BIEN: Usar requireHousehold cuando sea obligatorio
const householdId = await requireHousehold(); // Nunca null después de esto
```

---

## 📊 **result.ts - Tipo Result para Server Actions**

### **⚠️ PATRÓN OBLIGATORIO EN SERVER ACTIONS**

Todas las Server Actions DEBEN retornar `Result<T>`.

### Tipos

```typescript
export type Ok<T = unknown> = { 
  ok: true; 
  data?: T;
};

export type Fail = { 
  ok: false; 
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type Result<T = unknown> = Ok<T> | Fail;
```

### Helpers

```typescript
// Crear resultado exitoso
export const ok = <T>(data?: T): Ok<T> => ({ ok: true, data });

// Crear resultado fallido
export const fail = (message: string, fieldErrors?: Record<string, string[]>): Fail => ({
  ok: false,
  message,
  fieldErrors,
});
```

### Uso en Server Actions

```typescript
'use server';
import { ok, fail, type Result } from '@/lib/result';
import { z } from 'zod';

const PetSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  species: z.string().min(1, 'Especie requerida'),
  daily_food_goal_grams: z.number().min(1, 'Meta debe ser mayor a 0'),
});

export async function createPet(formData: FormData): Promise<Result> {
  // 1. Verificar auth + household
  const householdId = await requireHousehold();
  
  // 2. Validar input
  const parsed = PetSchema.safeParse({
    name: formData.get('name'),
    species: formData.get('species'),
    daily_food_goal_grams: Number(formData.get('daily_food_goal_grams')),
  });
  
  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }
  
  // 3. Ejecutar query
  try {
    const result = await query(`
      INSERT INTO pets (household_id, name, species, daily_food_goal_grams)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [householdId, parsed.data.name, parsed.data.species, parsed.data.daily_food_goal_grams]);
    
    // 4. Revalidar rutas afectadas
    revalidatePath('/pets');
    
    // 5. Retornar éxito con datos opcionales
    return ok(result.rows[0]);
    
  } catch (error) {
    console.error('Error creating pet:', error);
    return fail('Error al crear mascota. Intenta de nuevo.');
  }
}
```

### Uso en Cliente (Client Component)

```typescript
'use client';
import { useState } from 'react';
import { createPet } from './actions';

export function PetForm() {
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(formData: FormData) {
    const result = await createPet(formData);
    
    if (!result.ok) {
      setError(result.message);
      // Opcional: mostrar fieldErrors en inputs específicos
      if (result.fieldErrors) {
        console.log(result.fieldErrors);
      }
    } else {
      // Éxito: redirigir o mostrar toast
      router.push('/pets');
    }
  }
  
  return (
    <form action={handleSubmit}>
      {error && <div className="text-red-500">{error}</div>}
      {/* ... inputs */}
    </form>
  );
}
```

### ❌ **ANTI-PATRONES**

```typescript
// ❌ MAL: No retornar Result
export async function createPet(formData: FormData) {
  await query('INSERT INTO pets ...'); // No hay forma de saber si funcionó
}

// ❌ MAL: Lanzar excepciones en lugar de fail()
export async function createPet(formData: FormData): Promise<Result> {
  throw new Error('Algo falló'); // El cliente no puede capturarlo
}

// ❌ MAL: No validar con Zod
export async function createPet(formData: FormData): Promise<Result> {
  const name = formData.get('name'); // Podría ser null, string, File...
  await query('INSERT INTO pets (name) VALUES ($1)', [name]); // Error potencial
}
```

### ✅ **PATRONES CORRECTOS**

```typescript
// ✅ BIEN: Server Action completa
export async function createPet(formData: FormData): Promise<Result> {
  const householdId = await requireHousehold();
  
  const parsed = PetSchema.safeParse({ /* ... */ });
  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }
  
  try {
    await query('INSERT INTO pets ...', [householdId, parsed.data.name]);
    revalidatePath('/pets');
    return ok();
  } catch (error) {
    return fail('Error al crear mascota');
  }
}
```

---

## 📅 **date.ts - Manipulación de Fechas**

### Propósito

Helpers para trabajar con fechas en el contexto de Pet SiKness.

### Ejemplos de Funciones (Implementar según Necesidad)

```typescript
// Obtener fecha de hoy en formato YYYY-MM-DD
export function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Formatear fecha para display
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Obtener rango de fechas (últimos N días)
export function getDateRange(days: number): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - days);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}
```

---

## 🎨 **format.ts - Formateo de Datos**

### Propósito

Formatear números, texto, enums para display.

### Ejemplos de Funciones (Implementar según Necesidad)

```typescript
// Formatear gramos
export function formatGrams(grams: number): string {
  return `${grams}g`;
}

// Formatear porcentaje
export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Traducir enum a español
export function translateSpecies(species: string): string {
  const map: Record<string, string> = {
    cat: 'Gato',
    dog: 'Perro',
    bird: 'Ave',
  };
  return map[species] || species;
}

export function translateAppetite(appetite: string): string {
  const map: Record<string, string> = {
    refused: 'Rechazó',
    poor: 'Malo',
    normal: 'Normal',
    good: 'Bueno',
    excellent: 'Excelente',
  };
  return map[appetite] || appetite;
}
```

---

## 🛠️ **utils.ts - Utilidades Generales**

### `cn()` - Merge de clases Tailwind

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

**Uso**:

```typescript
import { cn } from '@/lib/utils';

<button className={cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50 cursor-not-allowed'
)}>
  Click
</button>
```

---

## ✅ **CHECKLIST AL CREAR NUEVOS HELPERS**

1. ✅ **Ubicación correcta**:
   - Acceso a DB → `db.ts`
   - Auth/usuario → `auth.ts`
   - Formateo → `format.ts` o `date.ts`
   - Generales → `utils.ts`

2. ✅ **TypeScript estricto**:
   - Tipos explícitos en parámetros y retorno
   - No usar `any`
   - Documentar con JSDoc si es complejo

3. ✅ **Testeable**:
   - Funciones puras cuando sea posible
   - Sin side effects ocultos
   - Crear test en `__tests__/`

4. ✅ **Exports nombrados**:
   ```typescript
   export function myHelper() { ... }  // ✅ BIEN
   export default myHelper;             // ❌ Evitar default exports
   ```

---

## 🚫 **PROHIBICIONES**

- ❌ NUNCA acceder a PostgreSQL sin usar `query()` o `transaction()`
- ❌ NUNCA construir SQL con concatenación de strings
- ❌ NUNCA olvidar filtrar por `household_id` en queries
- ❌ NUNCA retornar algo distinto a `Result<T>` en Server Actions
- ❌ NUNCA usar `any` en tipos
- ❌ NUNCA lanzar excepciones en Server Actions (usar `fail()`)

---

**🔥 ESTAS SON LAS REGLAS PARA TODOS LOS HELPERS 🔥**
