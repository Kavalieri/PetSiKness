import Link from "next/link";
import { Eye, Pencil, Trash2, Package } from "lucide-react";
import type { Foods } from "@/types/database.generated";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FOOD_TYPE_OPTIONS,
  QUALITY_OPTIONS,
  SPECIES_OPTIONS,
} from "@/lib/constants/foods";

// ============================================
// TYPES
// ============================================

interface FoodCardProps {
  food: Foods;
  onDelete?: (id: string) => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Get food type display info
 */
function getFoodTypeDisplay(foodType: string) {
  const option = FOOD_TYPE_OPTIONS.find((opt) => opt.value === foodType);
  return {
    label: option?.label || foodType,
    emoji: option?.emoji || "🍽️",
  };
}

/**
 * Get quality display info
 */
function getQualityDisplay(quality: string | null) {
  if (!quality) return null;
  const option = QUALITY_OPTIONS.find((opt) => opt.value === quality);
  return {
    label: option?.label || quality,
    emoji: option?.emoji || "",
    color: option?.color || "text-gray-600",
  };
}

/**
 * Get species display
 */
function getSpeciesDisplay(speciesArray: string[] | null) {
  if (!speciesArray || speciesArray.length === 0) {
    return "Todas las especies";
  }

  const labels = speciesArray
    .map((species) => {
      const option = SPECIES_OPTIONS.find((opt) => opt.value === species);
      return option ? `${option.emoji} ${option.label}` : species;
    })
    .join(", ");

  return labels;
}

/**
 * Format price
 */
function formatPrice(price: number | null, packageSize: number | null) {
  if (!price) return null;
  
  const priceStr = `${price.toFixed(2)}€`;
  
  if (packageSize && packageSize > 0) {
    const pricePerKg = (price / (packageSize / 1000)).toFixed(2);
    return `${priceStr} (${pricePerKg}€/kg)`;
  }
  
  return priceStr;
}

/**
 * Get badge variant for quality
 */
function getQualityVariant(
  quality: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (!quality) return "outline";
  
  switch (quality) {
    case "excellent":
      return "default"; // Verde
    case "good":
      return "secondary"; // Azul/gris
    case "fair":
      return "secondary"; // Naranja
    case "poor":
      return "destructive"; // Rojo
    default:
      return "outline";
  }
}

// ============================================
// COMPONENT
// ============================================

export function FoodCard({ food, onDelete }: FoodCardProps) {
  // Convertir tipos Kysely a tipos simples
  const foodId = String(food.id);
  const speciesArray = (food.suitable_for_species as unknown) as string[] | null;
  const caloriesNum = food.calories_per_100g ? Number(food.calories_per_100g) : null;
  const proteinNum = food.protein_percentage ? Number(food.protein_percentage) : null;
  const fatNum = food.fat_percentage ? Number(food.fat_percentage) : null;
  const carbsNum = food.carbs_percentage ? Number(food.carbs_percentage) : null;
  const priceNum = food.price_per_package ? Number(food.price_per_package) : null;
  const packageNum = food.package_size_grams ? Number(food.package_size_grams) : null;

  const foodType = getFoodTypeDisplay(food.food_type);
  const palatability = getQualityDisplay(food.palatability);
  const species = getSpeciesDisplay(speciesArray);
  const price = formatPrice(priceNum, packageNum);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {/* Header con emoji del tipo de comida */}
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center gap-3">
          {/* Emoji grande centrado */}
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-5xl border-2 border-border shadow-sm">
            {foodType.emoji}
          </div>

          {/* Nombre y marca centrados */}
          <div className="text-center w-full">
            <CardTitle className="text-xl font-bold">{food.name}</CardTitle>
            {food.brand && (
              <p className="text-sm text-muted-foreground mt-1">
                {food.brand}
              </p>
            )}
          </div>
        </div>

        {/* Badge del tipo de alimento */}
        <div className="flex justify-center mt-2">
          <Badge variant="secondary" className="text-xs">
            {foodType.label}
          </Badge>
        </div>
      </CardHeader>

      {/* Content con información nutricional y producto */}
      <CardContent className="space-y-3 text-sm">
        {/* Información Nutricional */}
        {(caloriesNum ||
          proteinNum ||
          fatNum) && (
          <div className="space-y-1">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase">
              Nutrición (por 100g)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {caloriesNum && (
                <div className="flex items-center justify-between bg-muted px-2 py-1 rounded">
                  <span className="text-xs">Calorías:</span>
                  <span className="font-medium">
                    {caloriesNum} kcal
                  </span>
                </div>
              )}
              {proteinNum && (
                <div className="flex items-center justify-between bg-muted px-2 py-1 rounded">
                  <span className="text-xs">Proteína:</span>
                  <span className="font-medium">
                    {proteinNum}%
                  </span>
                </div>
              )}
              {fatNum && (
                <div className="flex items-center justify-between bg-muted px-2 py-1 rounded">
                  <span className="text-xs">Grasa:</span>
                  <span className="font-medium">{fatNum}%</span>
                </div>
              )}
              {carbsNum && (
                <div className="flex items-center justify-between bg-muted px-2 py-1 rounded">
                  <span className="text-xs">Carbohidratos:</span>
                  <span className="font-medium">{carbsNum}%</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Palatabilidad */}
        {palatability && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Palatabilidad:
            </span>
            <Badge variant={getQualityVariant(food.palatability)}>
              {palatability.emoji} {palatability.label}
            </Badge>
          </div>
        )}

        {/* Especies aptas */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">
            Apto para:
          </span>
          <p className="text-xs">{species}</p>
        </div>

        {/* Tamaño paquete y precio */}
        {(packageNum || price) && (
          <div className="pt-2 border-t space-y-1">
            {packageNum && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Tamaño:
                </span>
                <span className="text-xs font-medium">
                  {packageNum >= 1000
                    ? `${(packageNum / 1000).toFixed(1)} kg`
                    : `${packageNum} g`}
                </span>
              </div>
            )}
            {price && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Precio:</span>
                <span className="text-xs font-medium">{price}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>

      {/* Footer con acciones */}
      <CardFooter className="flex gap-2 pt-4 border-t">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1"
          aria-label={`Ver detalles de ${food.name}`}
        >
          <Link href={`/foods/${foodId}`}>
            <Eye className="w-4 h-4 mr-1" />
            Ver
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="flex-1"
          aria-label={`Editar ${food.name}`}
        >
          <Link href={`/foods/${foodId}/edit`}>
            <Pencil className="w-4 h-4 mr-1" />
            Editar
          </Link>
        </Button>
        {onDelete && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(foodId)}
            aria-label={`Eliminar ${food.name}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
