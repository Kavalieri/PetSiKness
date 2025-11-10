import { requireHousehold } from "@/lib/auth";
import { getFoodById } from "@/app/foods/actions";
import { FoodFormWrapper } from "./FoodFormWrapper";
import { notFound } from "next/navigation";
import { ArrowLeft, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata } from "next";

interface EditFoodPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: EditFoodPageProps): Promise<Metadata> {
  const result = await getFoodById(params.id);

  if (!result.ok) {
    return {
      title: "Alimento no encontrado | Pet SiKness",
    };
  }

  return {
    title: `Editar ${result.data?.name} | Pet SiKness`,
    description: `Editando información de ${result.data?.name}`,
  };
}

export default async function EditFoodPage({ params }: EditFoodPageProps) {
  // 1. Auth y contexto
  await requireHousehold();

  // 2. Fetch alimento
  const result = await getFoodById(params.id);

  // 3. 404 si no existe
  if (!result.ok || !result.data) {
    notFound();
  }

  const food = result.data;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
        <Link href="/foods">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Catálogo
          </Button>
        </Link>
        <span>/</span>
        <Link href={`/foods/${food.id}`}>
          <Button variant="ghost" size="sm">
            Ver Detalle
          </Button>
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
          <Edit className="h-6 w-6 text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Editar Alimento</h1>
          <p className="text-muted-foreground">
            Actualizando: {food.name}
            {food.brand && ` - ${food.brand}`}
          </p>
        </div>
      </div>

      {/* Formulario con wrapper client */}
      <FoodFormWrapper food={food} />
    </div>
  );
}
