# 📚 Lib - Helper Libraries

Bibliotecas de utilidades y helpers reutilizables en Pet SiKness.

---

## 📂 Estructura

```
lib/
├── db.ts               # Acceso a PostgreSQL
├── auth.ts             # Autenticación y contexto de usuario
├── result.ts           # Tipo Result para Server Actions
├── format.ts           # Formateo de datos
├── date.ts             # Utilidades de fechas
├── utils.ts            # Utilidades generales
└── __tests__/          # Tests unitarios
```

---

## 🗄️ db.ts - Acceso a PostgreSQL

### API Principal

#### `query(sql, params)`

Ejecuta una query SQL parametrizada.

```typescript
import { query } from '@/lib/db';

const result = await query(
  'SELECT * FROM pets WHERE household_id = $1',
  [householdId]
);

console.log(result.rows); // Array de resultados
console.log(result.rowCount); // Número de filas
```

**Parámetros**:
- `sql`: String SQL con placeholders `$1, $2, $3...`
- `params`: Array de valores para los placeholders

**Retorno**: `QueryResult<T>` con `.rows` y `.rowCount`

#### `transaction(callback)`

Ejecuta múltiples queries en una transacción.

```typescript
import { transaction } from '@/lib/db';

await transaction(async (client) => {
  await client.query('INSERT INTO feedings ...', [...]);
  await client.query('UPDATE pets ...', [...]);
  // Si cualquiera falla, se hace rollback automático
});
```

**Parámetros**:
- `callback`: Función async que recibe un `client` y ejecuta queries

**Comportamiento**:
- BEGIN automático al iniciar
- COMMIT si todas las queries tienen éxito
- ROLLBACK automático si hay error

### Pool de Conexiones

Configurado con:
- **Max**: 20 conexiones simultáneas
- **Idle timeout**: 30 segundos
- **Connection timeout**: 2 segundos

```typescript
import { pool } from '@/lib/db';

// Ver estado del pool (debugging)
console.log('Total:', pool.totalCount);
console.log('Idle:', pool.idleCount);
console.log('Waiting:', pool.waitingCount);
```

---

## 🔐 auth.ts - Autenticación

### API Principal

#### `getCurrentUser()`

Obtiene el usuario autenticado actual.

```typescript
import { getCurrentUser } from '@/lib/auth';

const user = await getCurrentUser();

if (user) {
  console.log(user.profile_id);   // UUID
  console.log(user.email);         // Email
  console.log(user.display_name);  // Nombre o null
  console.log(user.avatar_url);    // Avatar o null
} else {
  // No hay sesión
}
```

**Retorno**: Objeto de usuario o `null`

#### `getUserHouseholdId()`

Obtiene el ID del hogar del usuario actual.

```typescript
import { getUserHouseholdId } from '@/lib/auth';

const householdId = await getUserHouseholdId();

if (householdId) {
  // Usuario pertenece a un hogar
  // Usar para filtrar queries por household_id
} else {
  // Usuario no tiene hogar (debe unirse o crear uno)
}
```

**Retorno**: UUID del household o `null`

**⚠️ Uso Crítico**: SIEMPRE usar este ID para filtrar queries por `household_id`.

#### `requireAuth()`

Fuerza autenticación. Redirige a `/login` si no autenticado.

```typescript
import { requireAuth } from '@/lib/auth';

export default async function ProtectedPage() {
  await requireAuth(); // Redirect si no autenticado
  
  // Si llega aquí, usuario está autenticado
  const user = await getCurrentUser(); // Nunca null
  
  return <div>Contenido protegido</div>;
}
```

**Uso**: Páginas que requieren autenticación obligatoria.

#### `requireHousehold()`

Fuerza autenticación + membership en hogar. Redirige si falta.

```typescript
import { requireHousehold } from '@/lib/auth';

export default async function PetsPage() {
  const householdId = await requireHousehold();
  
  // Si llega aquí:
  // - Usuario está autenticado
  // - Usuario pertenece a un hogar
  // - householdId nunca es null
  
  const pets = await query(
    'SELECT * FROM pets WHERE household_id = $1',
    [householdId]
  );
  
  return <PetList pets={pets.rows} />;
}
```

**Uso**: Páginas que requieren household obligatorio.

---

## 📊 result.ts - Tipo Result

### API

Tipo discriminado para resultados de Server Actions.

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

#### `ok(data?)`

Crea un resultado exitoso.

```typescript
import { ok } from '@/lib/result';

return ok(); // Sin datos
return ok({ id: '123', name: 'Fluffy' }); // Con datos
```

#### `fail(message, fieldErrors?)`

Crea un resultado fallido.

```typescript
import { fail } from '@/lib/result';

return fail('Error al crear mascota');

// Con errores de campos específicos (Zod)
return fail('Datos inválidos', {
  name: ['Nombre es requerido'],
  daily_food_goal_grams: ['Debe ser mayor a 0'],
});
```

### Uso en Server Actions

```typescript
'use server';
import { ok, fail, type Result } from '@/lib/result';

export async function createPet(formData: FormData): Promise<Result> {
  // Validación
  const parsed = PetSchema.safeParse({ ... });
  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }
  
  // Lógica
  try {
    await query('INSERT INTO pets ...', [...]);
    return ok();
  } catch (error) {
    return fail('Error al crear mascota');
  }
}
```

### Manejo en Cliente

```typescript
'use client';

async function handleSubmit(formData: FormData) {
  const result = await createPet(formData);
  
  if (!result.ok) {
    // Error
    setError(result.message);
    if (result.fieldErrors) {
      // Mostrar errores por campo
      console.log(result.fieldErrors);
    }
  } else {
    // Éxito
    if (result.data) {
      console.log('Creado:', result.data);
    }
    router.push('/pets');
  }
}
```

---

## 📅 date.ts - Utilidades de Fechas

Funciones para trabajar con fechas (implementar según necesidad).

### Ejemplos

```typescript
// Obtener fecha de hoy
export function getTodayDate(): string;

// Formatear fecha para display
export function formatDate(date: Date | string): string;

// Obtener rango de fechas
export function getDateRange(days: number): { start: string; end: string };
```

---

## 🎨 format.ts - Formateo

Funciones para formatear datos para display (implementar según necesidad).

### Ejemplos

```typescript
// Formatear gramos
export function formatGrams(grams: number): string;

// Formatear porcentaje
export function formatPercentage(value: number): string;

// Traducir enums
export function translateSpecies(species: string): string;
export function translateAppetite(appetite: string): string;
```

---

## 🛠️ utils.ts - Utilidades Generales

### `cn(...classes)`

Merge de clases CSS con Tailwind.

```typescript
import { cn } from '@/lib/utils';

<button className={cn(
  'px-4 py-2 rounded',
  isActive && 'bg-blue-500',
  isDisabled && 'opacity-50'
)}>
  Click
</button>
```

**Internamente usa**:
- `clsx`: Construcción condicional de clases
- `tailwind-merge`: Merge inteligente de clases Tailwind

---

## 🧪 Testing

Tests unitarios en `lib/__tests__/`.

### Estructura Recomendada

```
lib/__tests__/
├── format.test.ts      # Tests de formateo
├── date.test.ts        # Tests de fechas
└── utils.test.ts       # Tests de utilidades
```

### Ejemplo de Test

```typescript
import { describe, it, expect } from 'vitest';
import { formatGrams } from '@/lib/format';

describe('formatGrams', () => {
  it('formats grams correctly', () => {
    expect(formatGrams(100)).toBe('100g');
    expect(formatGrams(0)).toBe('0g');
  });
});
```

**Ejecutar tests**:

```bash
npm run test
```

---

## 📖 Guías de Uso

### Acceso a Base de Datos

**SIEMPRE**:
1. Usar `query()` o `transaction()`
2. Queries parametrizadas con `$1, $2...`
3. Filtrar por `household_id`

```typescript
// ✅ Correcto
const householdId = await requireHousehold();
const pets = await query(
  'SELECT * FROM pets WHERE household_id = $1',
  [householdId]
);

// ❌ Incorrecto (falta household_id)
const pets = await query('SELECT * FROM pets');
```

### Autenticación en Páginas

**Server Component que requiere household**:

```typescript
export default async function Page() {
  const householdId = await requireHousehold();
  // Usuario autenticado + tiene household garantizado
}
```

**Server Component que puede o no tener household**:

```typescript
export default async function Page() {
  const user = await getCurrentUser();
  const householdId = await getUserHouseholdId();
  
  if (!householdId) {
    return <div>Únete a un hogar primero</div>;
  }
  
  // Continuar con householdId
}
```

### Server Actions

**Patrón completo**:

```typescript
'use server';
import { requireHousehold } from '@/lib/auth';
import { query } from '@/lib/db';
import { ok, fail, type Result } from '@/lib/result';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const Schema = z.object({ /* ... */ });

export async function myAction(formData: FormData): Promise<Result> {
  // 1. Auth + contexto
  const householdId = await requireHousehold();
  
  // 2. Validación
  const parsed = Schema.safeParse({ /* ... */ });
  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }
  
  // 3. Lógica
  try {
    await query('...', [householdId, parsed.data]);
    revalidatePath('/ruta-afectada');
    return ok();
  } catch (error) {
    console.error(error);
    return fail('Error al ejecutar acción');
  }
}
```

---

## ⚠️ Errores Comunes

### Error: "permission denied for table"

**Causa**: Conectando con usuario sin permisos o tabla sin ownership correcto.

**Solución**: Verificar que DATABASE_URL usa `pet_user` y tabla tiene owner `pet_owner`.

### Error: "Cannot read property 'X' of null"

**Causa**: No verificar que `getCurrentUser()` o `getUserHouseholdId()` retornan `null`.

**Solución**: Usar `requireAuth()` o `requireHousehold()`, o verificar explícitamente:

```typescript
const user = await getCurrentUser();
if (!user) {
  redirect('/login');
}
console.log(user.email); // Seguro
```

### Error: "relation does not exist"

**Causa**: Conectado a base de datos incorrecta o tabla no existe.

**Solución**: Verificar `.env.*` y aplicar migraciones.

---

## 🔗 Referencias

- **PostgreSQL Pool**: https://node-postgres.com/apis/pool
- **Zod Validation**: https://zod.dev
- **NextAuth**: https://next-auth.js.org

---

**Última actualización:** 9 Noviembre 2025
