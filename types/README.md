# 📘 Types - TypeScript Types

Sistema de tipos TypeScript en Pet SiKness.

---

## 📂 Estructura

```
types/
├── database.generated.ts   # Auto-generado desde PostgreSQL
└── next-auth.d.ts          # Extensiones de NextAuth
```

---

## ⚙️ database.generated.ts - Types Auto-generados

### Descripción

Archivo generado automáticamente desde el schema de PostgreSQL usando `kysely-codegen`.

**⚠️ NO EDITAR MANUALMENTE**

### Contenido

- **Interfaces TypeScript** para todas las tablas
- **Enums** de PostgreSQL
- **Tipos exactos** de columnas
- **JSDoc** desde comentarios SQL

### Regeneración

**Automática** tras aplicar migraciones.

**Manual**:

```bash
# Desde DEV
npm run types:generate:dev

# Desde PROD
npm run types:generate:prod

# Verificar compilación
npm run typecheck
```

### Tipos Disponibles

#### Tablas

```typescript
import type {
  Profiles,           // Usuarios OAuth
  Households,         // Familias de mascotas
  HouseholdMembers,   // Membresía en hogares
  Pets,               // Perfiles de mascotas
  Foods,              // Catálogo de alimentos
  Feedings,           // Registros de alimentación
  Migrations,         // Control de migraciones
} from '@/types/database.generated';
```

#### Vistas

```typescript
import type {
  DailyFeedingSummary, // Resumen diario agregado
} from '@/types/database.generated';
```

### Ejemplo: Tipo Pets

```typescript
export interface Pets {
  id: string;                    // UUID
  household_id: string;          // UUID
  name: string;
  species: string;
  breed: string | null;
  birth_date: string | null;     // Date as ISO string
  gender: "male" | "female" | "unknown" | null;
  weight_kg: string | null;      // DECIMAL as string
  body_condition: "underweight" | "ideal" | "overweight" | "obese" | null;
  daily_food_goal_grams: number;
  daily_meals_target: number | null;
  health_notes: string | null;
  allergies: string[] | null;
  medications: string[] | null;
  appetite: "poor" | "normal" | "good" | "excellent" | null;
  activity_level: "sedentary" | "low" | "moderate" | "high" | "very_high" | null;
  created_at: Date;              // TIMESTAMPTZ
  updated_at: Date;
}
```

### Uso en Código

**En Queries**:

```typescript
import { query } from '@/lib/db';
import type { Pets } from '@/types/database.generated';

const result = await query<Pets>(
  'SELECT * FROM pets WHERE household_id = $1',
  [householdId]
);

const pets: Pets[] = result.rows;
```

**En Componentes**:

```typescript
import type { Pets } from '@/types/database.generated';

interface PetCardProps {
  pet: Pets;
}

export function PetCard({ pet }: PetCardProps) {
  return <div>{pet.name}</div>;
}
```

**En Server Actions**:

```typescript
import type { Pets } from '@/types/database.generated';
import type { Result } from '@/lib/result';

export async function createPet(
  data: CreatePetInput
): Promise<Result<Pets>> {
  const result = await query<Pets>(
    'INSERT INTO pets (...) VALUES (...) RETURNING *',
    [...]
  );
  
  return ok(result.rows[0]);
}
```

---

## 🔧 next-auth.d.ts - Extensiones NextAuth

### Descripción

Extensiones de tipos para NextAuth con campos custom del perfil.

### Contenido

```typescript
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
  // Campos custom
  console.log(session.user.profile_id);
  console.log(session.user.display_name);
  console.log(session.user.avatar_url);
  
  // Campos de DefaultSession
  console.log(session.user.email);
  console.log(session.user.name);
  console.log(session.user.image);
}
```

---

## 📝 Types Custom

### Cuándo Crear

Solo si:
- No existe en `database.generated.ts`
- Es para lógica de negocio específica
- Es un DTO (Data Transfer Object)
- Es tipo de utilidad

### Ubicación Recomendada

```
types/
├── dtos.ts       # DTOs para APIs
├── forms.ts      # Tipos para formularios
└── utils.ts      # Tipos de utilidad
```

### Ejemplos

**DTOs**:

```typescript
// types/dtos.ts
import type { Pets } from './database.generated';

export interface CreatePetDTO {
  name: string;
  species: string;
  breed?: string;
  daily_food_goal_grams: number;
}

export interface PetWithStats extends Pets {
  total_feedings: number;
  avg_daily_intake: number;
}
```

**Utilidades**:

```typescript
// types/utils.ts

export type RequireFields<T, K extends keyof T> = 
  T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = 
  Omit<T, K> & Partial<Pick<T, K>>;
```

---

## 🔄 Workflow de Types

### 1. Modificar Schema (migración SQL)

```sql
-- database/migrations/20251109_120000_add_microchip.sql
ALTER TABLE pets ADD COLUMN microchip_number TEXT;
```

### 2. Aplicar Migración

```bash
sudo -u postgres psql -d pet_sikness_dev \
  -f database/migrations/20251109_120000_add_microchip.sql
```

### 3. Regenerar Types

```bash
npm run types:generate:dev
```

### 4. Verificar Compilación

```bash
npm run typecheck
# Output esperado: No errors found
```

### 5. Usar Nuevos Types

```typescript
import type { Pets } from '@/types/database.generated';

// TypeScript ahora conoce 'microchip_number'
const pet: Pets = {
  // ... otros campos
  microchip_number: "ABC123",
};
```

---

## ⚠️ Errores Comunes

### "Property does not exist on type"

**Causa**: Types desactualizados

**Solución**:
```bash
npm run types:generate:dev
```

### "Cannot find module '@/types/database.generated'"

**Causa**: Archivo no generado

**Solución**:
```bash
npm run types:generate:dev
```

### Types no coinciden con DB

**Causa**: Migración aplicada sin regenerar types

**Solución**:
```bash
npm run types:generate:dev
npm run typecheck
```

---

## 📖 Best Practices

### ✅ Hacer

- Importar con `import type { ... }`
- Regenerar types tras cada migración
- Verificar compilación con `npm run typecheck`
- Usar tipos generados en queries: `query<Pets>(...)`
- Crear types custom solo cuando sea necesario

### ❌ No Hacer

- Editar `database.generated.ts` manualmente
- Duplicar tipos que ya existen
- Usar `any` (preferir `unknown` con type narrowing)
- Olvidar regenerar types
- Hacer commit sin verificar compilación

---

## 🔗 Referencias

- **kysely-codegen**: https://github.com/RobinBlomberg/kysely-codegen
- **TypeScript**: https://www.typescriptlang.org/docs
- **NextAuth Types**: https://next-auth.js.org/getting-started/typescript

---

**Última actualización:** 9 Noviembre 2025
