# 🚀 Plan de Desarrollo - Fase 2: CRUD Mascotas

**Estado**: 📋 PENDIENTE
**Inicio**: 9 Noviembre 2025
**Objetivo**: Implementar gestión completa de mascotas del hogar

---

## 🎯 Objetivo de la Fase

Crear el módulo completo de gestión de mascotas que permita a los usuarios:

- Ver lista de todas las mascotas de su hogar
- Crear nuevas mascotas con perfil completo
- Editar información de mascotas existentes
- Eliminar mascotas (con confirmación)
- Ver detalle completo de cada mascota

---

## 📋 Tareas Planificadas

### 1. Preparación y Estructura Base

**Estado**: ⏳ Pendiente

- [ ] Revisar schema de tabla `pets` (database.generated.ts)
- [ ] Crear tipos auxiliares para formularios
- [ ] Definir esquemas Zod para validación
- [ ] Crear constantes para especies, razas, condiciones

**Archivos a crear/modificar**:

- `types/pets.ts` - Tipos auxiliares y enums
- `lib/constants/pets.ts` - Constantes de especies, razas

---

### 2. Server Actions (Backend Logic)

**Estado**: ⏳ Pendiente

**Archivos a crear**: `app/pets/actions.ts`

Implementar Server Actions siguiendo el patrón Result<T>:

```typescript
// CRUD básico
export async function getPets(): Promise<Result<Pet[]>>;
export async function getPetById(id: string): Promise<Result<Pet>>;
export async function createPet(
  formData: FormData
): Promise<Result<{ id: string }>>;
export async function updatePet(
  id: string,
  formData: FormData
): Promise<Result>;
export async function deletePet(id: string): Promise<Result>;
```

**Reglas críticas**:

- ✅ Siempre filtrar por `household_id` del usuario autenticado
- ✅ Validar con Zod antes de insertar/actualizar
- ✅ Retornar Result<T> consistente
- ✅ Ejecutar revalidatePath('/app/pets') tras mutaciones
- ✅ Usar helper `requireHousehold()` para auth

**Validaciones Zod**:

```typescript
const PetFormSchema = z.object({
  name: z.string().min(1, "Nombre requerido").max(100),
  species: z.enum(["cat", "dog", "bird", "rabbit", "other"]),
  breed: z.string().max(100).optional(),
  birth_date: z.string().pipe(z.coerce.date()).optional(),
  gender: z.enum(["male", "female", "unknown"]).optional(),
  weight_kg: z.number().positive("Peso debe ser mayor a 0").optional(),
  body_condition: z
    .enum(["underweight", "ideal", "overweight", "obese"])
    .optional(),
  daily_food_goal_grams: z.number().int().positive("Meta debe ser mayor a 0"),
  daily_meals_target: z.number().int().positive().default(2),
  // ... resto de campos
});
```

---

### 3. Componentes UI Base (shadcn/ui)

**Estado**: ⏳ Pendiente

**Componentes shadcn/ui a instalar**:

```bash
npx shadcn@latest add card
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add dialog
npx shadcn@latest add form
npx shadcn@latest add badge
npx shadcn@latest add alert
npx shadcn@latest add separator
```

---

### 4. Componentes de Dominio (Pet Components)

**Estado**: ⏳ Pendiente

**Estructura de carpetas**:

```
components/pets/
├── PetCard.tsx              # Card individual de mascota
├── PetList.tsx              # Lista/Grid de mascotas
├── PetForm.tsx              # Formulario crear/editar (Client Component)
├── PetDeleteDialog.tsx      # Dialog confirmación eliminar
├── PetDetailView.tsx        # Vista detalle completa
└── PetStatsCard.tsx         # Card de estadísticas básicas
```

#### 4.1. PetCard (Server Component)

**Props**:

```typescript
interface PetCardProps {
  pet: Pet;
  showActions?: boolean; // Mostrar botones editar/eliminar
}
```

**Contenido**:

- Avatar/Imagen de mascota (placeholder por ahora)
- Nombre y especie
- Edad (calculada desde birth_date)
- Peso y condición corporal
- Meta diaria de comida (badge)
- Botones: Ver detalle, Editar, Eliminar

**Estilo**:

- Card con hover effect
- Badge coloreado por condición corporal
- Icons de Lucide React

#### 4.2. PetList (Server Component)

**Props**:

```typescript
interface PetListProps {
  householdId: string;
}
```

**Funcionalidad**:

- Fetch de mascotas con `getPets()`
- Grid responsive (1 col móvil, 2 tablet, 3 desktop)
- Empty state si no hay mascotas
- Botón "Añadir Mascota" prominente

#### 4.3. PetForm (Client Component)

**Props**:

```typescript
interface PetFormProps {
  pet?: Pet; // Undefined = crear, definido = editar
  onSuccess?: () => void;
  onCancel?: () => void;
}
```

**Campos del formulario**:

- **Básicos**: name*, species*, breed, birth_date, gender
- **Físico**: weight_kg, body_condition
- **Nutrición**: daily_food_goal_grams\*, daily_meals_target
- **Salud**: health_notes, allergies (multi-input), medications (multi-input)
- **Comportamiento**: appetite, activity_level

**Validación**:

- react-hook-form + Zod
- Validación en tiempo real
- Mensajes de error claros
- Disabled mientras envía

**Estados**:

- Loading durante submit
- Success con toast
- Error con mensajes inline

#### 4.4. PetDeleteDialog (Client Component)

**Props**:

```typescript
interface PetDeleteDialogProps {
  pet: Pet;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}
```

**Funcionalidad**:

- Confirmación con nombre de mascota
- Warning sobre pérdida de datos
- Botones: Cancelar (secondary), Eliminar (destructive)

---

### 5. Páginas Next.js (App Router)

**Estado**: ⏳ Pendiente

#### 5.1. Listado - `/app/pets/page.tsx`

```typescript
// Server Component
import { requireHousehold } from "@/lib/auth";
import { PetList } from "@/components/pets/PetList";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function PetsPage() {
  const { householdId } = await requireHousehold();

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Mascotas</h1>
        <Link href="/pets/new">
          <Button>+ Añadir Mascota</Button>
        </Link>
      </div>
      <PetList householdId={householdId} />
    </div>
  );
}
```

#### 5.2. Crear - `/app/pets/new/page.tsx`

```typescript
// Client Component wrapper
"use client";
import { PetForm } from "@/components/pets/PetForm";
import { useRouter } from "next/navigation";

export default function NewPetPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Nueva Mascota</h1>
      <PetForm
        onSuccess={() => router.push("/pets")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
```

#### 5.3. Editar - `/app/pets/[id]/edit/page.tsx`

```typescript
import { requireHousehold } from "@/lib/auth";
import { getPetById } from "@/app/pets/actions";
import { PetForm } from "@/components/pets/PetForm";
import { notFound } from "next/navigation";

export default async function EditPetPage({
  params,
}: {
  params: { id: string };
}) {
  const { householdId } = await requireHousehold();
  const result = await getPetById(params.id);

  if (!result.ok) notFound();

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Editar Mascota</h1>
      <PetForm pet={result.data} />
    </div>
  );
}
```

#### 5.4. Detalle - `/app/pets/[id]/page.tsx`

```typescript
// Server Component
import { requireHousehold } from "@/lib/auth";
import { getPetById } from "@/app/pets/actions";
import { PetDetailView } from "@/components/pets/PetDetailView";
import { notFound } from "next/navigation";

export default async function PetDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { householdId } = await requireHousehold();
  const result = await getPetById(params.id);

  if (!result.ok) notFound();

  return (
    <div className="container mx-auto py-6">
      <PetDetailView pet={result.data} />
    </div>
  );
}
```

---

### 6. Layout y Navegación

**Estado**: ⏳ Pendiente

**Modificar**: `app/layout.tsx` o crear `app/pets/layout.tsx`

Añadir navegación:

- Link a /pets en navbar principal
- Active state cuando estás en sección pets
- Breadcrumbs en páginas internas

---

### 7. Testing Manual

**Estado**: ⏳ Pendiente

**Checklist de pruebas**:

- [ ] **Listar mascotas**
  - [ ] Ver lista vacía (empty state)
  - [ ] Ver lista con mascotas
  - [ ] Grid responsive
- [ ] **Crear mascota**
  - [ ] Validación de campos requeridos
  - [ ] Crear con datos mínimos
  - [ ] Crear con todos los datos
  - [ ] Validación de tipos (número, fecha)
  - [ ] Redirect tras éxito
- [ ] **Editar mascota**
  - [ ] Cargar datos existentes en form
  - [ ] Modificar y guardar
  - [ ] Validación al editar
  - [ ] Cancelar sin guardar
- [ ] **Eliminar mascota**
  - [ ] Dialog de confirmación
  - [ ] Eliminar exitoso
  - [ ] Cancelar eliminación
- [ ] **Ver detalle**

  - [ ] Mostrar toda la info
  - [ ] Links a editar/eliminar
  - [ ] 404 si no existe

- [ ] **Seguridad**
  - [ ] Solo ver mascotas de mi hogar
  - [ ] No poder editar mascotas de otros
  - [ ] Auth required en todas las rutas

---

## 🎨 Guía de Estilos UI/UX

### Paleta de Colores (Tailwind)

**Condición Corporal**:

- `underweight` → `bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200`
- `ideal` → `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`
- `overweight` → `bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`
- `obese` → `bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200`

**Especies (iconos sugeridos)**:

- `cat` → 🐱 Cat (lucide-react)
- `dog` → 🐕 Dog (lucide-react)
- `bird` → 🐦 Bird (lucide-react)
- `rabbit` → 🐰 Rabbit (lucide-react)
- `other` → 🐾 PawPrint (lucide-react)

### Responsive Design

**Breakpoints**:

- `sm`: 640px (móvil horizontal)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)

**Grid de mascotas**:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
```

### Accesibilidad

- Labels en todos los inputs
- aria-labels en botones de iconos
- Focus visible (ring)
- Contraste suficiente (WCAG AA)
- Keyboard navigation

---

## 📝 Convenciones de Código

### Nomenclatura

```typescript
// Componentes
PetCard.tsx
PetList.tsx

// Actions
app/pets/actions.ts
createPet()
updatePet()

// Types
types/pets.ts
Pet (de database.generated.ts)
PetFormData
```

### Imports

```typescript
// Siempre usar alias @/
import { Pet } from "@/types/database.generated";
import { Button } from "@/components/ui/button";
import { createPet } from "@/app/pets/actions";
```

### Server Actions Pattern

```typescript
'use server';
import { revalidatePath } from 'next/cache';
import { ok, fail } from '@/lib/result';
import type { Result } from '@/lib/result';

export async function createPet(formData: FormData): Promise<Result> {
  // 1. Auth + context
  const context = await requireHousehold();
  if (!context.ok) return fail(context.message);

  // 2. Validación
  const parsed = PetFormSchema.safeParse(...);
  if (!parsed.success) {
    return fail('Datos inválidos', parsed.error.flatten().fieldErrors);
  }

  // 3. Lógica DB
  try {
    await query('INSERT INTO pets ...', [...]);
  } catch (error) {
    return fail('Error al crear mascota');
  }

  // 4. Revalidación
  revalidatePath('/app/pets');
  return ok();
}
```

---

## 🔄 Workflow de Desarrollo

### 1. Iteración por Componente

Desarrollar en este orden (bottom-up):

1. **Server Actions** → Lógica backend primero
2. **Componentes simples** → PetCard
3. **Componentes compuestos** → PetList
4. **Forms** → PetForm (más complejo)
5. **Páginas** → Integración final

### 2. Git Workflow

**Por cada feature completada**:

```bash
# Commit con mensaje descriptivo
git add .
git commit -m "feat(pets): implement PetCard component"
git push origin main
```

**Convenciones de commits**:

- `feat(pets):` - Nueva funcionalidad
- `fix(pets):` - Corrección de bug
- `style(pets):` - Cambios de estilo UI
- `refactor(pets):` - Refactorización
- `test(pets):` - Añadir tests

### 3. Testing en Cada Paso

**Después de cada componente/action**:

```bash
# Verificar tipos
npm run typecheck

# Iniciar DEV si no está corriendo
./scripts/PM2_build_and_deploy_and_dev/pm2-dev-start.sh

# Ver logs en tiempo real
pm2 logs petsikness-dev --timestamp

# Probar en navegador
# http://localhost:3002/pets
```

---

## 📦 Dependencias Adicionales

Todas las dependencias necesarias ya están instaladas:

✅ **UI**: shadcn/ui, Radix UI, Tailwind CSS
✅ **Forms**: react-hook-form (instalar si falta), zod
✅ **Icons**: lucide-react
✅ **Dates**: date-fns
✅ **Types**: kysely-codegen (auto-generación)

---

## ⚠️ Checklist de Seguridad

Antes de cada commit:

- [ ] ✅ Todas las queries filtran por `household_id`
- [ ] ✅ Validación Zod en Server Actions
- [ ] ✅ NO exponer IDs sensibles en URLs públicas
- [ ] ✅ Auth check en todas las páginas
- [ ] ✅ Result<T> pattern consistente
- [ ] ✅ revalidatePath() tras mutaciones

---

## 🎯 Criterios de Éxito

**La Fase 2 está completa cuando**:

✅ Usuario puede ver lista de mascotas de su hogar
✅ Usuario puede crear nuevas mascotas
✅ Usuario puede editar mascotas existentes
✅ Usuario puede eliminar mascotas
✅ Usuario puede ver detalle completo de mascota
✅ Validación funciona correctamente
✅ UI responsive en móvil, tablet, desktop
✅ No hay errores en typecheck
✅ Código committeado y pusheado a GitHub

---

## 📚 Referencias

- **Schema DB**: `database/migrations/20251109_000000_baseline_v1.0.0.sql`
- **Types**: `types/database.generated.ts`
- **Patrones**: `app/AGENTS.md`, `components/AGENTS.md`
- **Helpers**: `lib/auth.ts`, `lib/result.ts`, `lib/db.ts`

---

**Plan creado**: 9 Noviembre 2025
**Última actualización**: 9 Noviembre 2025
**Estado**: 📋 LISTO PARA DESARROLLO
