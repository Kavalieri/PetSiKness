# Components - Instrucciones Específicas

> **Contexto**: Parte de Pet SiKness (ver `/AGENTS.md` principal)
> **Área**: Componentes UI Reutilizables (shadcn/ui + Custom)

---

## 📂 **ESTRUCTURA DEL DIRECTORIO**

```
components/
├── ui/                 # shadcn/ui components (auto-generados)
│   ├── button.tsx
│   ├── input.tsx
│   ├── card.tsx
│   ├── form.tsx
│   ├── label.tsx
│   └── ... (más según se añadan)
└── [custom]/           # Custom components (por implementar)
    ├── PetCard.tsx
    ├── FeedingForm.tsx
    ├── DailySummary.tsx
    └── ...
```

---

## 🎨 **shadcn/ui - COMPONENTES BASE**

### **⚠️ IMPORTANTE: Instalación y Uso**

Pet SiKness usa **shadcn/ui** para componentes base accesibles y personalizables.

### Instalación de Componentes

**NO** instalar con `npm install`. Usar CLI de shadcn:

```bash
# Añadir un nuevo componente
npx shadcn@latest add button

# Añadir múltiples componentes
npx shadcn@latest add button input card form label

# Ver componentes disponibles
npx shadcn@latest add
```

**Qué hace esto**:
1. Descarga el componente a `components/ui/`
2. Configura con Tailwind CSS + Radix UI
3. Listo para usar y personalizar (ES TU CÓDIGO, no una dependencia)

### Componentes Actuales

#### **button.tsx** ✅ INSTALADO

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default">Click</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="ghost">Ghost</Button>
<Button size="sm">Pequeño</Button>
<Button size="lg">Grande</Button>
```

**Variantes disponibles**:
- `default`: Azul primario
- `destructive`: Rojo para acciones peligrosas
- `outline`: Borde sin fondo
- `secondary`: Gris secundario
- `ghost`: Sin fondo ni borde
- `link`: Estilo de enlace

**Tamaños**:
- `default`: Normal
- `sm`: Pequeño
- `lg`: Grande
- `icon`: Solo icono (cuadrado)

### Componentes Comunes a Añadir (Según Necesidad)

| Componente | Uso | Instalación |
|------------|-----|-------------|
| `input` | Campos de texto | `npx shadcn@latest add input` |
| `card` | Tarjetas de contenido | `npx shadcn@latest add card` |
| `form` | Formularios con react-hook-form | `npx shadcn@latest add form` |
| `label` | Labels accesibles | `npx shadcn@latest add label` |
| `select` | Dropdowns | `npx shadcn@latest add select` |
| `textarea` | Texto multilínea | `npx shadcn@latest add textarea` |
| `dialog` | Modales | `npx shadcn@latest add dialog` |
| `dropdown-menu` | Menús desplegables | `npx shadcn@latest add dropdown-menu` |
| `toast` | Notificaciones | `npx shadcn@latest add toast` |
| `table` | Tablas | `npx shadcn@latest add table` |
| `calendar` | Selector de fecha | `npx shadcn@latest add calendar` |
| `badge` | Etiquetas | `npx shadcn@latest add badge` |

---

## 🧩 **COMPONENTES CUSTOM - GUÍA DE CREACIÓN**

### **Server vs Client Components**

#### **Server Component** (por defecto)

**Cuándo usar**:
- Componente sin interactividad (solo render)
- No usa hooks de React (`useState`, `useEffect`, etc.)
- No maneja eventos (`onClick`, `onChange`, etc.)
- Puede hacer fetch directo de datos

**Ejemplo**: `PetCard` (solo display)

```typescript
// components/PetCard.tsx (Server Component)
import type { Pets } from '@/types/database.generated';
import { formatGrams } from '@/lib/format';

interface PetCardProps {
  pet: Pets;
}

export function PetCard({ pet }: PetCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{pet.name}</h3>
      <p className="text-sm text-muted-foreground">{pet.species}</p>
      <p className="mt-2">Meta diaria: {formatGrams(pet.daily_food_goal_grams)}</p>
    </div>
  );
}
```

#### **Client Component** (con `'use client'`)

**Cuándo usar**:
- Usa hooks (`useState`, `useEffect`, `useRouter`, etc.)
- Maneja eventos (`onClick`, `onChange`, `onSubmit`, etc.)
- Usa Context API
- Necesita acceso a browser APIs (window, localStorage, etc.)

**Ejemplo**: `FeedingForm` (formulario interactivo)

```typescript
// components/FeedingForm.tsx (Client Component)
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { createFeeding } from '@/app/feeding/actions';

interface FeedingFormProps {
  petId: string;
  foodId: string;
}

export function FeedingForm({ petId, foodId }: FeedingFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [amountServed, setAmountServed] = useState('');
  
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const formData = new FormData();
    formData.set('pet_id', petId);
    formData.set('food_id', foodId);
    formData.set('amount_served_grams', amountServed);
    
    const result = await createFeeding(formData);
    
    if (!result.ok) {
      setError(result.message);
    } else {
      // Éxito: limpiar o redirigir
      setAmountServed('');
    }
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="text-red-500 text-sm">{error}</div>}
      
      <div>
        <label htmlFor="amount">Cantidad servida (gramos)</label>
        <input
          id="amount"
          type="number"
          value={amountServed}
          onChange={(e) => setAmountServed(e.target.value)}
          className="w-full rounded border px-3 py-2"
        />
      </div>
      
      <Button type="submit">Registrar comida</Button>
    </form>
  );
}
```

### Convenciones de Nombres

**Archivos**: `PascalCase.tsx`
- ✅ `PetCard.tsx`
- ✅ `FeedingForm.tsx`
- ✅ `DailySummary.tsx`
- ❌ `pet-card.tsx`
- ❌ `petCard.tsx`

**Componentes**: `export function ComponentName`
- ✅ `export function PetCard() { ... }`
- ❌ `export default function PetCard() { ... }` (evitar default exports)

**Props Interface**: `ComponentNameProps`
- ✅ `interface PetCardProps { ... }`
- ❌ `interface Props { ... }`

### Estructura de Archivo Recomendada

```typescript
// 1. Imports
import type { Pets } from '@/types/database.generated';
import { Button } from '@/components/ui/button';

// 2. Types
interface PetCardProps {
  pet: Pets;
  onEdit?: () => void;
}

// 3. Component
export function PetCard({ pet, onEdit }: PetCardProps) {
  // Lógica
  
  // Render
  return (
    <div className="...">
      {/* Contenido */}
    </div>
  );
}
```

---

## 🎨 **ESTILOS CON TAILWIND CSS**

### Clases Comunes

**Layout**:
```typescript
<div className="flex items-center justify-between gap-4">
<div className="grid grid-cols-2 gap-4">
<div className="space-y-4"> // Espacio vertical entre hijos
```

**Spacing**:
```typescript
p-4   // padding: 1rem
px-4  // padding horizontal
py-2  // padding vertical
m-4   // margin
gap-4 // gap en flex/grid
```

**Tipografía**:
```typescript
text-sm         // 14px
text-base       // 16px
text-lg         // 18px
font-semibold   // font-weight: 600
font-bold       // font-weight: 700
text-muted-foreground  // Color secundario
```

**Borders y Radius**:
```typescript
border          // border: 1px solid
border-2        // border: 2px solid
rounded         // border-radius: 4px
rounded-lg      // border-radius: 8px
rounded-full    // border-radius: 9999px
```

**Colores** (definidos en `tailwind.config.ts`):
```typescript
bg-background     // Fondo principal
bg-card          // Fondo de tarjetas
bg-primary       // Color primario
text-primary     // Texto primario
text-muted-foreground  // Texto secundario
border           // Color de borde
```

### Dark Mode

Automático con `next-themes` (ya configurado).

```typescript
// Variante dark
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-gray-100">
```

**NO es necesario** configurarlo manualmente en componentes. Ya está global.

---

## 📋 **PATRONES COMUNES**

### Tarjeta de Contenido

```typescript
<div className="rounded-lg border bg-card p-4 shadow-sm">
  <h3 className="font-semibold">{title}</h3>
  <p className="text-sm text-muted-foreground">{description}</p>
</div>
```

### Listado de Items

```typescript
<div className="space-y-4">
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</div>
```

### Formulario con Feedback

```typescript
'use client';
import { useState } from 'react';

export function MyForm() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await myAction(formData);
    
    if (!result.ok) {
      setError(result.message);
    } else {
      setSuccess(true);
    }
  }
  
  return (
    <form action={handleSubmit}>
      {error && <div className="text-red-500 text-sm">{error}</div>}
      {success && <div className="text-green-500 text-sm">¡Éxito!</div>}
      {/* Inputs */}
    </form>
  );
}
```

### Botón de Acción Peligrosa

```typescript
<Button
  variant="destructive"
  onClick={() => {
    if (confirm('¿Estás seguro?')) {
      handleDelete();
    }
  }}
>
  Eliminar
</Button>
```

---

## ❌ **ANTI-PATRONES - NO HACER**

### ❌ Usar hooks en Server Components

```typescript
// ❌ MAL: Server Component con useState
export function PetCard({ pet }: PetCardProps) {
  const [isHovered, setIsHovered] = useState(false); // ERROR
  // ...
}

// ✅ BIEN: Convertir a Client Component
'use client';
export function PetCard({ pet }: PetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  // ...
}
```

### ❌ Fetch en Client Component para datos iniciales

```typescript
// ❌ MAL: Fetch en Client Component
'use client';
export function PetList() {
  const [pets, setPets] = useState([]);
  
  useEffect(() => {
    fetch('/api/pets').then(...); // Innecesario, usar Server Component
  }, []);
}

// ✅ BIEN: Fetch en Server Component + pasar props
export async function PetList() {
  const pets = await query('SELECT * FROM pets WHERE household_id = $1', [householdId]);
  return <PetListClient pets={pets.rows} />;
}
```

### ❌ Estilos inline sin Tailwind

```typescript
// ❌ MAL: Estilos inline
<div style={{ padding: '16px', borderRadius: '8px' }}>

// ✅ BIEN: Tailwind classes
<div className="p-4 rounded-lg">
```

### ❌ Default exports

```typescript
// ❌ MAL: Default export
export default function PetCard() { ... }

// ✅ BIEN: Named export
export function PetCard() { ... }
```

### ❌ Componentes en archivos de Server Actions

```typescript
// ❌ MAL: Mezclar componentes y actions en mismo archivo
// app/pets/actions.ts
'use server';
export async function createPet() { ... }
export function PetForm() { ... } // Componente aquí NO

// ✅ BIEN: Separar
// app/pets/actions.ts
'use server';
export async function createPet() { ... }

// components/PetForm.tsx
'use client';
export function PetForm() { ... }
```

---

## ✅ **CHECKLIST AL CREAR COMPONENTE**

1. ✅ **Decidir Server vs Client**:
   - ¿Usa hooks o eventos? → Client (`'use client'`)
   - Solo render? → Server (sin directiva)

2. ✅ **Nombrar correctamente**:
   - Archivo: `PascalCase.tsx`
   - Export: `export function ComponentName`
   - Props: `interface ComponentNameProps`

3. ✅ **Tipos explícitos**:
   - Props con interface
   - Usar types de `database.generated.ts` cuando aplique

4. ✅ **Tailwind classes**:
   - No estilos inline
   - Usar clases de `tailwind.config.ts`

5. ✅ **Accesibilidad**:
   - `<label>` con `htmlFor`
   - `<button>` con `type="button"` (o `"submit"`)
   - Alt text en imágenes
   - Roles ARIA cuando sea necesario

6. ✅ **Ubicación**:
   - shadcn/ui → `components/ui/` (auto)
   - Custom → `components/` root o subdir temático

---

## 🧪 **TESTING (Opcional)**

Tests de componentes en `components/__tests__/`.

### Ejemplo con Vitest + Testing Library

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PetCard } from '../PetCard';

describe('PetCard', () => {
  it('renders pet name', () => {
    const pet = { name: 'Fluffy', species: 'cat', daily_food_goal_grams: 200 };
    render(<PetCard pet={pet} />);
    expect(screen.getByText('Fluffy')).toBeInTheDocument();
  });
});
```

---

## 📚 **REFERENCIAS**

- **shadcn/ui Docs**: https://ui.shadcn.com
- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com (base de shadcn/ui)
- **React Server Components**: https://react.dev/reference/rsc/server-components

---

**🔥 ESTAS SON LAS REGLAS PARA TODOS LOS COMPONENTES 🔥**
