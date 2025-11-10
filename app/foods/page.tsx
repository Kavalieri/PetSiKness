import { requireHousehold } from '@/lib/auth';
import { getFoods } from './actions';
import { FoodList } from '@/components/foods/FoodList';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, UtensilsCrossed, Package, Droplet, Apple } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Alimentos | Pet SiKness',
  description: 'Gestiona el catálogo de alimentos para tus mascotas',
};

export default async function FoodsPage() {
  // 1. Auth y contexto
  await requireHousehold();

  // 2. Fetch alimentos
  const result = await getFoods();
  const foods = result.ok ? (result.data ?? []) : [];

  // 3. Calcular estadísticas
  const dryCount = foods.filter((f) => f.food_type === 'dry').length;
  const wetCount = foods.filter((f) => f.food_type === 'wet').length;
  const otherCount = foods.filter((f) =>
    ['raw', 'homemade', 'treats'].includes(String(f.food_type))
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <UtensilsCrossed className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Catálogo de Alimentos</h1>
            <p className="text-muted-foreground">
              Gestiona los alimentos para tus mascotas
            </p>
          </div>
        </div>

        <Link href="/foods/new">
          <Button size="lg" className="w-full sm:w-auto">
            <PlusCircle className="mr-2 h-5 w-5" />
            Añadir Alimento
          </Button>
        </Link>
      </div>

      {/* Estadísticas rápidas */}
      {foods.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Alimentos"
            value={foods.length}
            icon={<UtensilsCrossed className="h-5 w-5 text-muted-foreground" />}
          />
          <StatCard
            label="Pienso Seco"
            value={dryCount}
            icon={<Package className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
          />
          <StatCard
            label="Comida Húmeda"
            value={wetCount}
            icon={<Droplet className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
          />
          <StatCard
            label="Otros"
            value={otherCount}
            icon={<Apple className="h-5 w-5 text-green-600 dark:text-green-400" />}
          />
        </div>
      )}

      {/* Lista de alimentos con búsqueda y filtros */}
      <FoodList />
    </div>
  );
}

// Componente auxiliar para stats
function StatCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          {icon && <div className="opacity-80">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}
