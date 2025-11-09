# Next.js App - Instrucciones Específicas

> **Contexto**: Parte de Pet SiKness (ver `/AGENTS.md` principal)
> **Área**: Frontend + Backend integrados en Next.js App Router

---

## 🏗️ **Arquitectura Next.js 14**

### App Router Structure (Actual)

```
/app/
├── layout.tsx              # Root layout (global providers)
├── page.tsx               # Home page (público)
├── login/
│   └── page.tsx           # Login con Google OAuth
├── api/
│   └── auth/
│       └── [...nextauth]/
│           └── route.ts   # NextAuth configuration
└── globals.css            # Global styles
```

### App Router Structure (Planeada)

```
/app/
├── layout.tsx
├── page.tsx
├── login/page.tsx
├── dashboard/              # 📋 PENDIENTE
│   └── page.tsx           # Dashboard principal con resúmenes
├── pets/                  # 📋 PENDIENTE
│   ├── page.tsx           # Listado de mascotas
│   ├── [id]/
│   │   └── page.tsx       # Detalle de mascota
│   ├── new/
│   │   └── page.tsx       # Crear nueva mascota
│   ├── actions.ts         # Server actions (CRUD)
│   └── components/
│       ├── PetForm.tsx
│       ├── PetCard.tsx
│       └── PetList.tsx
├── foods/                 # 📋 PENDIENTE
│   ├── page.tsx           # Catálogo de alimentos
│   ├── [id]/
│   │   └── page.tsx       # Detalle de alimento
│   ├── new/
│   │   └── page.tsx       # Crear nuevo alimento
│   ├── actions.ts         # Server actions (CRUD)
│   └── components/
│       ├── FoodForm.tsx
│       ├── FoodCard.tsx
│       └── NutritionInfo.tsx
├── feeding/               # 📋 PENDIENTE
│   ├── page.tsx           # Calendario de alimentación
│   ├── actions.ts         # Server actions (registrar comidas)
│   └── components/
│       ├── FeedingForm.tsx
│       ├── DailyBalance.tsx
│       └── FeedingCalendar.tsx
└── settings/              # 📋 PENDIENTE
    ├── page.tsx           # Configuración del hogar
    └── actions.ts         # Household management
```

---

## 🎨 **Patrones de Componentes**

### 1. Server Components (Default)

**Cuándo usar**: Páginas que necesitan datos del servidor al renderizar

```typescript
// app/pets/page.tsx
import { getUserHouseholdId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Pets } from '@/types/database.generated';
import { PetList } from './components/PetList';

export default async function PetsPage() {
  // ✅ Fetch data directamente en el componente
  const householdId = await getUserHouseholdId();
  
  const result = await query<Pets>(
    `SELECT * FROM pets WHERE household_id = $1 ORDER BY name`,
    [householdId]
  );
  
  const pets = result.rows;

  // ✅ Pass data a Client Components via props
  return (
    <div>
      <h1>Mis Mascotas</h1>
      <PetList pets={pets} />
    </div>
  );
}
```

**Características**:
- No tienen `'use client'`
- Pueden usar async/await
- Acceso directo a base de datos
- NO pueden usar hooks de React (useState, useEffect)
- NO pueden manejar eventos del navegador

### 2. Client Components (Explicit)

**Cuándo usar**: Interactividad, estado local, eventos del navegador

```typescript
// app/pets/components/PetList.tsx
'use client';

import { useState } from 'react';
import type { Pets } from '@/types/database.generated';
import { PetCard } from './PetCard';

interface Props {
  pets: Pets[];
}

export function PetList({ pets }: Props) {
  const [filter, setFilter] = useState('');

  const filteredPets = pets.filter(pet =>
    pet.name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div>
      <input
        type="text"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Buscar mascota..."
      />
      <div className="grid gap-4">
        {filteredPets.map(pet => (
          <PetCard key={pet.id} pet={pet} />
        ))}
      </div>
    </div>
  );
}
```

**Características**:
- Requieren `'use client'` al inicio
- Pueden usar hooks (useState, useEffect, etc.)
- Manejan eventos del navegador
- NO pueden ser async
- NO pueden acceder a DB directamente

### 3. Server Actions (Recommended Pattern)

**Ubicación**: `actions.ts` en cada directorio de ruta

```typescript
// app/pets/actions.ts
'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { query } from '@/lib/db';
import { getUserHouseholdId } from '@/lib/auth';
import { ok, fail } from '@/lib/result';
import type { Result } from '@/lib/result';

// Schema de validación
const PetSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  species: z.string().min(1, 'La especie es requerida'),
  breed: z.string().optional(),
  weight_kg: z.number().positive('El peso debe ser positivo'),
  daily_food_goal_grams: z.number().positive('El objetivo debe ser positivo'),
  daily_meals_target: z.number().int().positive().optional(),
});

export async function createPet(formData: FormData): Promise<Result> {
  // 1. Validar input
  const parsed = PetSchema.safeParse({
    name: formData.get('name'),
    species: formData.get('species'),
    breed: formData.get('breed'),
    weight_kg: Number(formData.get('weight_kg')),
    daily_food_goal_grams: Number(formData.get('daily_food_goal_grams')),
    daily_meals_target: formData.get('daily_meals_target') 
      ? Number(formData.get('daily_meals_target')) 
      : null,
  });

  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }

  // 2. Verificar contexto de usuario
  const householdId = await getUserHouseholdId();
  if (!householdId) {
    return fail('No perteneces a ningún hogar');
  }

  try {
    // 3. Ejecutar operación en DB
    await query(
      `INSERT INTO pets (
        household_id, name, species, breed, weight_kg, 
        daily_food_goal_grams, daily_meals_target
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        householdId,
        parsed.data.name,
        parsed.data.species,
        parsed.data.breed,
        parsed.data.weight_kg,
        parsed.data.daily_food_goal_grams,
        parsed.data.daily_meals_target,
      ]
    );

    // 4. Revalidar rutas afectadas
    revalidatePath('/pets');
    
    return ok();
  } catch (error) {
    console.error('Error creating pet:', error);
    return fail('Error al crear la mascota');
  }
}

export async function deletePet(petId: string): Promise<Result> {
  const householdId = await getUserHouseholdId();
  if (!householdId) {
    return fail('No autorizado');
  }

  try {
    // Verificar que la mascota pertenece al hogar
    const result = await query(
      `DELETE FROM pets 
       WHERE id = $1 AND household_id = $2 
       RETURNING id`,
      [petId, householdId]
    );

    if (result.rowCount === 0) {
      return fail('Mascota no encontrada o no autorizado');
    }

    revalidatePath('/pets');
    return ok();
  } catch (error) {
    console.error('Error deleting pet:', error);
    return fail('Error al eliminar la mascota');
  }
}
```

**Uso desde Client Component**:

```typescript
// app/pets/components/PetForm.tsx
'use client';

import { useTransition } from 'react';
import { createPet } from '../actions';
import { useToast } from '@/hooks/use-toast';

export function PetForm() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await createPet(formData);
      
      if (result.ok) {
        toast({ title: 'Mascota creada exitosamente' });
      } else {
        toast({ 
          title: 'Error', 
          description: result.message,
          variant: 'destructive' 
        });
      }
    });
  }

  return (
    <form action={handleSubmit}>
      <input name="name" placeholder="Nombre" required />
      <input name="species" placeholder="Especie" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Guardando...' : 'Guardar'}
      </button>
    </form>
  );
}
```

---

## 🔄 **Patrones de Datos**

### Patrón 1: Fetch en Server Component + Props

**Mejor para**: Páginas estáticas o que se regeneran poco

```typescript
// app/dashboard/page.tsx
export default async function DashboardPage() {
  const householdId = await getUserHouseholdId();
  
  const [pets, recentFeedings] = await Promise.all([
    query<Pets>(`SELECT * FROM pets WHERE household_id = $1`, [householdId]),
    query(`SELECT * FROM feedings WHERE household_id = $1 
           ORDER BY feeding_date DESC LIMIT 10`, [householdId]),
  ]);

  return <DashboardContent pets={pets.rows} feedings={recentFeedings.rows} />;
}
```

### Patrón 2: Server Actions + Revalidation

**Mejor para**: Mutaciones (crear, editar, eliminar)

```typescript
// Siempre usar revalidatePath después de mutaciones
revalidatePath('/pets');           // Específico
revalidatePath('/dashboard');      // Página afectada
revalidatePath('/pets/[id]', 'page'); // Con parámetro dinámico
```

### Patrón 3: Client Fetching (Evitar si es posible)

**Solo usar cuando**: Datos que cambian en tiempo real o polling

```typescript
'use client';

import { useEffect, useState } from 'react';

export function LiveFeedingStatus() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch('/api/feedings/status');
      const data = await res.json();
      setStatus(data);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return <div>{status?.message}</div>;
}
```

---

## 🎯 **Rutas y Navegación**

### Convenciones de Rutas

```
/pets              → Listado
/pets/new          → Crear
/pets/[id]         → Detalle
/pets/[id]/edit    → Editar (o modal)
```

### Navegación Programática

```typescript
'use client';

import { useRouter } from 'next/navigation';

export function CreatePetButton() {
  const router = useRouter();

  return (
    <button onClick={() => router.push('/pets/new')}>
      Nueva Mascota
    </button>
  );
}
```

### Links

```typescript
import Link from 'next/link';

<Link href="/pets/123">Ver Mascota</Link>
<Link href="/feeding">Registrar Comida</Link>
```

---

## 🔐 **Autenticación en Páginas**

### Proteger Página Completa

```typescript
// app/pets/page.tsx
import { requireAuth } from '@/lib/auth';

export default async function PetsPage() {
  // ✅ Lanza error si no está autenticado
  await requireAuth();

  // Resto del código...
}
```

### Verificar Household

```typescript
import { requireHousehold } from '@/lib/auth';

export default async function PetsPage() {
  // ✅ Verifica auth + household membership
  const householdId = await requireHousehold();

  // Resto del código...
}
```

### Obtener Usuario Actual

```typescript
import { getCurrentUser } from '@/lib/auth';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect('/login');
  }

  return <div>Hola {user.display_name}</div>;
}
```

---

## 🎨 **Styling y UI**

### Tailwind Classes

**Usar clases de Tailwind directamente**:

```typescript
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow">
  <h2 className="text-2xl font-bold text-gray-900">Título</h2>
  <p className="text-sm text-gray-600">Descripción</p>
</div>
```

### shadcn/ui Components

**Importar desde `/components/ui/`**:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Mi Mascota</CardTitle>
  </CardHeader>
  <CardContent>
    <Button>Editar</Button>
  </CardContent>
</Card>
```

### Componentes Propios

**Ubicación**: `/app/[ruta]/components/`

```typescript
// app/pets/components/PetCard.tsx
import type { Pets } from '@/types/database.generated';
import { Card } from '@/components/ui/card';

interface Props {
  pet: Pets;
}

export function PetCard({ pet }: Props) {
  return (
    <Card>
      <h3>{pet.name}</h3>
      <p>{pet.species}</p>
      <p>Objetivo: {pet.daily_food_goal_grams}g/día</p>
    </Card>
  );
}
```

---

## 📋 **Formularios**

### Patrón Recomendado: FormData + Server Actions

```typescript
// Client Component
'use client';

import { useFormStatus } from 'react-dom';
import { createPet } from '../actions';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Guardando...' : 'Guardar'}
    </button>
  );
}

export function PetForm() {
  return (
    <form action={createPet}>
      <input name="name" required />
      <input name="species" required />
      <input name="weight_kg" type="number" step="0.1" required />
      <SubmitButton />
    </form>
  );
}
```

### Con Validación en Cliente (Opcional)

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  species: z.string().min(1),
  weight_kg: z.number().positive(),
});

type FormData = z.infer<typeof schema>;

export function PetForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
    
    const result = await createPet(formData);
    // Manejar resultado...
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name')} />
      {errors.name && <span>{errors.name.message}</span>}
      <button type="submit">Guardar</button>
    </form>
  );
}
```

---

## ⚠️ **Errores Comunes**

### ❌ Error: Usar hooks en Server Component

```typescript
// ❌ MAL
export default async function Page() {
  const [state, setState] = useState(null); // ERROR!
  // ...
}

// ✅ BIEN - Server Component
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// ✅ BIEN - Client Component
'use client';
export function ClientComponent() {
  const [state, setState] = useState(null);
  // ...
}
```

### ❌ Error: Fetch en Client Component inicial

```typescript
// ❌ MAL - useEffect para fetch inicial
'use client';
export function PetsPage() {
  const [pets, setPets] = useState([]);
  
  useEffect(() => {
    fetch('/api/pets').then(/* ... */); // Innecesario
  }, []);
}

// ✅ BIEN - Server Component con fetch directo
export default async function PetsPage() {
  const pets = await fetchPets();
  return <PetsList pets={pets} />;
}
```

### ❌ Error: No revalidar tras mutaciones

```typescript
// ❌ MAL
export async function deletePet(id: string) {
  await query(`DELETE FROM pets WHERE id = $1`, [id]);
  return ok();
  // ❌ Falta revalidación!
}

// ✅ BIEN
export async function deletePet(id: string) {
  await query(`DELETE FROM pets WHERE id = $1`, [id]);
  revalidatePath('/pets'); // ✅
  return ok();
}
```

---

## 📚 **Referencias**

- **Next.js Docs**: https://nextjs.org/docs
- **Server Actions**: https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
- **shadcn/ui**: https://ui.shadcn.com/
- **React Hook Form**: https://react-hook-form.com/

---

**🔥 ESTAS SON LAS REGLAS PARA TODO EL CÓDIGO EN /app/ 🔥**
