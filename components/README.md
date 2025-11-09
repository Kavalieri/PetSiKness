# 🎨 Components - UI Components

Componentes de interfaz de usuario reutilizables en Pet SiKness.

---

## 📂 Estructura

```
components/
├── ui/                 # shadcn/ui components (base)
│   └── button.tsx     # ✅ Instalado
└── [custom]/          # Custom components (por implementar)
```

---

## 🎨 shadcn/ui - Componentes Base

Pet SiKness usa **shadcn/ui** para componentes accesibles y personalizables basados en Radix UI.

### Filosofía

**NO son paquetes npm**. Son archivos de código que copias a tu proyecto y personalizas.

**Instalación**:

```bash
# Añadir un componente
npx shadcn@latest add button

# Añadir múltiples
npx shadcn@latest add input card form
```

Esto copia el componente a `components/ui/` como código fuente editable.

---

## 📚 Componentes Disponibles

### Button (✅ Instalado)

Botón con múltiples variantes y tamaños.

```typescript
import { Button } from '@/components/ui/button';

// Variantes
<Button variant="default">Primario</Button>
<Button variant="destructive">Eliminar</Button>
<Button variant="outline">Cancelar</Button>
<Button variant="secondary">Secundario</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// Tamaños
<Button size="sm">Pequeño</Button>
<Button size="default">Normal</Button>
<Button size="lg">Grande</Button>
<Button size="icon"><IconComponent /></Button>

// Estados
<Button disabled>Deshabilitado</Button>

// Como Link (Next.js)
<Button asChild>
  <Link href="/pets">Ir a mascotas</Link>
</Button>
```

**Props**:
- `variant`: `"default" | "destructive" | "outline" | "secondary" | "ghost" | "link"`
- `size`: `"default" | "sm" | "lg" | "icon"`
- `asChild`: Render como child element (para Link)

---

## 🛠️ Componentes Recomendados a Añadir

### Formularios

```bash
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add textarea
npx shadcn@latest add select
npx shadcn@latest add form  # react-hook-form integration
```

**Uso**:

```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="name">Nombre</Label>
  <Input id="name" placeholder="Nombre de la mascota" />
</div>
```

### Contenedores

```bash
npx shadcn@latest add card
```

**Uso**:

```typescript
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Fluffy</CardTitle>
  </CardHeader>
  <CardContent>
    <p>Meta diaria: 200g</p>
  </CardContent>
</Card>
```

### Feedback

```bash
npx shadcn@latest add toast     # Notificaciones
npx shadcn@latest add alert     # Alertas
npx shadcn@latest add badge     # Etiquetas
```

**Uso**:

```typescript
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

toast({
  title: "Éxito",
  description: "Mascota creada correctamente",
});
```

### Navegación

```bash
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add tabs
```

### Datos

```bash
npx shadcn@latest add table
npx shadcn@latest add calendar
npx shadcn@latest add separator
```

---

## 🧩 Componentes Custom (Por Implementar)

### PetCard

Tarjeta para mostrar información de una mascota.

```typescript
// components/PetCard.tsx
import type { Pets } from '@/types/database.generated';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PetCardProps {
  pet: Pets;
  onEdit?: () => void;
}

export function PetCard({ pet, onEdit }: PetCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{pet.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{pet.species}</p>
      </CardHeader>
      <CardContent>
        <dl className="space-y-2">
          <div>
            <dt className="text-sm font-medium">Meta diaria</dt>
            <dd className="text-sm text-muted-foreground">
              {pet.daily_food_goal_grams}g
            </dd>
          </div>
          {pet.weight_kg && (
            <div>
              <dt className="text-sm font-medium">Peso</dt>
              <dd className="text-sm text-muted-foreground">
                {pet.weight_kg} kg
              </dd>
            </div>
          )}
        </dl>
        {onEdit && (
          <Button onClick={onEdit} variant="outline" className="mt-4">
            Editar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
```

### FeedingForm

Formulario para registrar alimentación.

```typescript
// components/FeedingForm.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createFeeding } from '@/app/feeding/actions';

interface FeedingFormProps {
  petId: string;
  petName: string;
}

export function FeedingForm({ petId, petName }: FeedingFormProps) {
  const [error, setError] = useState<string | null>(null);
  
  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await createFeeding(formData);
    
    if (!result.ok) {
      setError(result.message);
    } else {
      // Reset form o redirect
    }
  }
  
  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-semibold">Registrar comida para {petName}</h3>
      </div>
      
      {error && (
        <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}
      
      <input type="hidden" name="pet_id" value={petId} />
      
      <div>
        <Label htmlFor="food_id">Alimento</Label>
        <select id="food_id" name="food_id" className="w-full rounded border px-3 py-2">
          {/* Options from foods */}
        </select>
      </div>
      
      <div>
        <Label htmlFor="amount_served">Cantidad servida (gramos)</Label>
        <Input
          id="amount_served"
          name="amount_served_grams"
          type="number"
          min="1"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="amount_eaten">Cantidad comida (gramos)</Label>
        <Input
          id="amount_eaten"
          name="amount_eaten_grams"
          type="number"
          min="0"
          required
        />
      </div>
      
      <Button type="submit">Registrar</Button>
    </form>
  );
}
```

### DailySummary

Resumen del día para una mascota.

```typescript
// components/DailySummary.tsx
import type { DailyFeedingSummary } from '@/types/database.generated';

interface DailySummaryProps {
  summary: DailyFeedingSummary;
}

export function DailySummary({ summary }: DailySummaryProps) {
  const achievementColor = 
    summary.under_target ? 'text-orange-600' :
    summary.over_target ? 'text-red-600' :
    'text-green-600';
  
  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="font-semibold">{summary.pet_name}</h3>
      <p className="text-sm text-muted-foreground">
        {new Date(summary.feeding_date).toLocaleDateString('es-ES')}
      </p>
      
      <div className="mt-4 space-y-2">
        <div className="flex justify-between">
          <span className="text-sm">Comido:</span>
          <span className="text-sm font-medium">
            {summary.total_eaten_grams}g / {summary.daily_goal_grams}g
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-sm">Logro:</span>
          <span className={`text-sm font-bold ${achievementColor}`}>
            {summary.goal_achievement_pct}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${
              summary.under_target ? 'bg-orange-500' :
              summary.over_target ? 'bg-red-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(summary.goal_achievement_pct, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

---

## 🎨 Estilos y Temas

### Tailwind CSS

Todas las clases están disponibles. Ver [tailwindcss.com/docs](https://tailwindcss.com/docs).

**Spacing**: `p-4`, `m-2`, `gap-4`, `space-y-4`
**Layout**: `flex`, `grid`, `items-center`, `justify-between`
**Typography**: `text-sm`, `font-semibold`, `text-muted-foreground`
**Colors**: `bg-card`, `text-primary`, `border`

### Dark Mode

Ya configurado con `next-themes`. Automático según preferencia del sistema.

**Variantes**:

```typescript
<div className="bg-white dark:bg-gray-900">
<p className="text-gray-900 dark:text-gray-100">
```

---

## 📖 Guías de Uso

### Server Component (sin interactividad)

```typescript
// components/PetList.tsx
import type { Pets } from '@/types/database.generated';
import { PetCard } from './PetCard';

interface PetListProps {
  pets: Pets[];
}

export function PetList({ pets }: PetListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}
```

### Client Component (con interactividad)

```typescript
// components/InteractivePetCard.tsx
'use client';

import { useState } from 'react';
import type { Pets } from '@/types/database.generated';
import { Button } from '@/components/ui/button';

export function InteractivePetCard({ pet }: { pet: Pets }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="rounded-lg border p-4">
      <h3>{pet.name}</h3>
      <Button onClick={() => setIsExpanded(!isExpanded)}>
        {isExpanded ? 'Ver menos' : 'Ver más'}
      </Button>
      {isExpanded && <div>{/* Contenido adicional */}</div>}
    </div>
  );
}
```

### Composición de Componentes

```typescript
// app/pets/page.tsx
import { PetList } from '@/components/PetList';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function PetsPage() {
  const pets = await getPets();
  
  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Mis Mascotas</h1>
        <Button asChild>
          <Link href="/pets/new">Añadir mascota</Link>
        </Button>
      </div>
      
      <PetList pets={pets} />
    </div>
  );
}
```

---

## 🔗 Referencias

- **shadcn/ui**: https://ui.shadcn.com
- **Radix UI**: https://www.radix-ui.com
- **Tailwind CSS**: https://tailwindcss.com
- **React Server Components**: https://react.dev/reference/rsc/server-components

---

**Última actualización:** 9 Noviembre 2025
