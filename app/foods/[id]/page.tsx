import { requireHousehold } from "@/lib/auth";
import { getFoodById } from "@/app/foods/actions";
import { NutritionInfo } from "@/components/foods/NutritionInfo";
import { FoodDeleteButton } from "./FoodDeleteButton";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Package,
  DollarSign,
  CalendarDays,
  Star,
  Info,
} from "lucide-react";
import type { Metadata } from "next";
import {
  FOOD_TYPE_LABELS,
  AGE_RANGE_LABELS,
  QUALITY_LABELS,
  SPECIES_LABELS,
  getSpeciesEmoji,
} from "@/lib/constants/foods";

interface FoodDetailPageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: FoodDetailPageProps): Promise<Metadata> {
  const result = await getFoodById(params.id);

  if (!result.ok || !result.data) {
    return {
      title: "Alimento no encontrado | Pet SiKness",
    };
  }

  const food = result.data;

  return {
    title: `${food.name} | Pet SiKness`,
    description: `Información completa de ${food.name}${
      food.brand ? ` - ${food.brand}` : ""
    }`,
  };
}

export default async function FoodDetailPage({ params }: FoodDetailPageProps) {
  // 1. Auth y contexto
  await requireHousehold();

  // 2. Fetch alimento
  const result = await getFoodById(params.id);

  if (!result.ok || !result.data) {
    notFound();
  }

  const food = result.data;

  // Calcular precio por kg si hay datos
  const pricePerKg =
    food.price_per_package && food.package_size_grams
      ? (Number(food.price_per_package) / Number(food.package_size_grams)) *
        1000
      : null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header con acciones */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex-1">
            <div className="mb-4">
              <Link href="/foods">
                <Button variant="ghost" size="sm" className="gap-2 mb-4">
                  <ArrowLeft className="h-4 w-4" />
                  Volver al catálogo
                </Button>
              </Link>
            </div>

            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">
                {food.name}
              </h1>
              {food.brand && (
                <p className="text-xl text-muted-foreground mb-4">
                  {food.brand}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="default" className="text-sm">
                  {FOOD_TYPE_LABELS[
                    String(food.food_type) as keyof typeof FOOD_TYPE_LABELS
                  ] || food.food_type}
                </Badge>
                {food.age_range && (
                  <Badge variant="secondary" className="text-sm">
                    {AGE_RANGE_LABELS[
                      String(food.age_range) as keyof typeof AGE_RANGE_LABELS
                    ] || food.age_range}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2">
            <Link href={`/foods/${food.id}/edit`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Edit className="h-4 w-4" />
                Editar
              </Button>
            </Link>
            <FoodDeleteButton
              foodId={String(food.id)}
              foodName={String(food.name)}
            />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="space-y-8">
        {/* Sección 1: Información Nutricional ⭐ */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Información Nutricional</h2>
          <NutritionInfo food={food} />
        </section>

        {/* Sección 2: Detalles del Producto */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Detalles del Producto</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card: Presentación */}
            {(food.serving_size_grams || food.package_size_grams) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Presentación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {food.serving_size_grams && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tamaño porción
                      </span>
                      <span className="font-medium">
                        {food.serving_size_grams}g
                      </span>
                    </div>
                  )}
                  {food.package_size_grams && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Tamaño paquete
                      </span>
                      <span className="font-medium">
                        {food.package_size_grams}g
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Card: Precio */}
            {food.price_per_package && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Precio
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      ${Number(food.price_per_package).toFixed(2)}
                    </div>
                    <p className="text-sm text-muted-foreground">por paquete</p>

                    {pricePerKg && (
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Precio por kg:
                          </span>
                          <span className="font-semibold">
                            ${pricePerKg.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Card: Calidad */}
            {(food.palatability || food.digestibility) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Calidad
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {food.palatability && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Palatabilidad
                      </span>
                      <Badge variant="outline">
                        {getQualityEmoji(String(food.palatability))}{" "}
                        {QUALITY_LABELS[
                          String(
                            food.palatability
                          ) as keyof typeof QUALITY_LABELS
                        ] || food.palatability}
                      </Badge>
                    </div>
                  )}
                  {food.digestibility && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Digestibilidad
                      </span>
                      <Badge variant="outline">
                        {getQualityEmoji(String(food.digestibility))}{" "}
                        {QUALITY_LABELS[
                          String(
                            food.digestibility
                          ) as keyof typeof QUALITY_LABELS
                        ] || food.digestibility}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </section>

        {/* Sección 3: Ingredientes */}
        {food.ingredients && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Ingredientes</h2>
            <Card>
              <CardContent className="pt-6">
                <p className="text-muted-foreground leading-relaxed">
                  {food.ingredients}
                </p>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Sección 4: Restricciones y Aptitud */}
        {(food.suitable_for_species || food.age_range) && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Aptitud y Restricciones</h2>
            <Card>
              <CardContent className="pt-6 space-y-4">
                {food.suitable_for_species &&
                  Array.isArray(food.suitable_for_species) &&
                  food.suitable_for_species.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        Adecuado para
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {food.suitable_for_species.map((species: string) => (
                          <Badge
                            key={species}
                            variant="outline"
                            className="text-sm"
                          >
                            {getSpeciesEmoji(species)}{" "}
                            {SPECIES_LABELS[
                              species as keyof typeof SPECIES_LABELS
                            ] || species}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                {food.age_range && (
                  <div>
                    <h3 className="font-semibold mb-2">Etapa de vida</h3>
                    <Badge variant="secondary">
                      {AGE_RANGE_LABELS[
                        String(food.age_range) as keyof typeof AGE_RANGE_LABELS
                      ] || food.age_range}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        {/* Sección 5: Metadata */}
        <section>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              <span>
                Añadido el{" "}
                {new Date(String(food.created_at)).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              {food.updated_at !== food.created_at && (
                <span>
                  • Actualizado el{" "}
                  {new Date(String(food.updated_at)).toLocaleDateString(
                    "es-ES",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </span>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// Helper para emojis de calidad
function getQualityEmoji(quality: string): string {
  const emojis: Record<string, string> = {
    poor: "😞",
    fair: "😐",
    good: "🙂",
    excellent: "😋",
  };
  return emojis[quality] || "❓";
}
