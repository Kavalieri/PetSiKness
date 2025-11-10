import { requireHousehold } from "@/lib/auth";
import { getFoods } from "./actions";
import { FoodList } from "@/components/foods/FoodList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  PlusCircle,
  UtensilsCrossed,
  Package,
  Droplet,
  Apple,
  Beef,
  Cookie,
  Pill,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

// Configuración de iconos y colores por tipo
const FOOD_TYPE_CONFIG = {
  dry: {
    label: "Pienso Seco",
    icon: Package,
    color: "text-amber-600 dark:text-amber-400",
  },
  wet: {
    label: "Comida Húmeda",
    icon: Droplet,
    color: "text-blue-600 dark:text-blue-400",
  },
  raw: {
    label: "Dieta BARF",
    icon: Beef,
    color: "text-red-600 dark:text-red-400",
  },
  homemade: {
    label: "Casera",
    icon: Apple,
    color: "text-green-600 dark:text-green-400",
  },
  treat: {
    label: "Chucherías",
    icon: Cookie,
    color: "text-purple-600 dark:text-purple-400",
  },
  supplement: {
    label: "Suplementos",
    icon: Pill,
    color: "text-cyan-600 dark:text-cyan-400",
  },
} as const;

export const metadata: Metadata = {
  title: "Alimentos | Pet SiKness",
  description: "Gestiona el catálogo de alimentos para tus mascotas",
};

export default async function FoodsPage() {
  // 1. Auth y contexto
  await requireHousehold();

  // 2. Fetch alimentos
  const result = await getFoods();
  const foods = result.ok ? result.data ?? [] : [];

  // 3. Calcular estadísticas dinámicas
  // Contar por tipo
  const typeCounts = foods.reduce((acc, food) => {
    const type = String(food.food_type);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Obtener top 3 tipos más usados (excluyendo total)
  const topTypes = Object.entries(typeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([type, count]) => ({
      type,
      count,
      config: FOOD_TYPE_CONFIG[type as keyof typeof FOOD_TYPE_CONFIG],
    }))
    .filter((item) => item.config); // Filtrar tipos sin config

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
            <UtensilsCrossed className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Catálogo de Alimentos
            </h1>
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
          {topTypes.map(({ type, count, config }) => (
            <StatCard
              key={type}
              label={config.label}
              value={count}
              icon={<config.icon className={`h-5 w-5 ${config.color}`} />}
            />
          ))}
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
