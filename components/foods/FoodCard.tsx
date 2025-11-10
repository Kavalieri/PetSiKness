import Link from "next/link";
import { Eye, Pencil, Trash2, Package } from "lucide-react";
import type { Foods } from "@/types/database.generated";
import type { FoodType } from "@/types/foods";
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
  PALATABILITY_OPTIONS,
  DIGESTIBILITY_OPTIONS,
  SPECIES_OPTIONS,
} from "@/lib/constants/foods";
import { isEmojiIcon, getPhotoDisplay } from "@/lib/constants/food-icons";
import { FoodImage } from "./FoodImage";
import { CompactNutritionView } from "./NutritionInfo";

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
 * Get palatability display info
 */
function getPalatabilityDisplay(palatability: string | null) {
  if (!palatability) return null;
  const option = PALATABILITY_OPTIONS.find((opt) => opt.value === palatability);
  return {
    label: option?.label || palatability,
    emoji: option?.emoji || "",
    color: option?.color || "text-gray-600",
  };
}

/**
 * Get digestibility display info
 */
function getDigestibilityDisplay(digestibility: string | null) {
  if (!digestibility) return null;
  const option = DIGESTIBILITY_OPTIONS.find(
    (opt) => opt.value === digestibility
  );
  return {
    label: option?.label || digestibility,
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
  const speciesArray = food.suitable_for_species as unknown as string[] | null;

  // Solo necesitamos verificar si hay datos nutricionales para el condicional
  const hasNutritionData =
    food.calories_per_100g || food.protein_percentage || food.fat_percentage;

  const priceNum = food.price_per_package
    ? Number(food.price_per_package)
    : null;
  const packageNum = food.package_size_grams
    ? Number(food.package_size_grams)
    : null;

  const foodType = getFoodTypeDisplay(food.food_type);
  const palatability = getPalatabilityDisplay(food.palatability);
  const digestibility = getDigestibilityDisplay(food.digestibility);
  const species = getSpeciesDisplay(speciesArray);
  const price = formatPrice(priceNum, packageNum);

  // Display para foto (emoji, imagen subida o URL)
  const photoDisplay = getPhotoDisplay(
    food.photo_url,
    food.food_type as FoodType
  );
  const isEmoji = isEmojiIcon(food.photo_url);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {/* Header con emoji del tipo de comida */}
      <CardHeader className="pb-3">
        <div className="flex flex-col items-center gap-3">
          {/* Foto/Icono grande centrado */}
          <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center text-5xl border-2 border-border shadow-sm overflow-hidden">
            {isEmoji ? (
              <span>{photoDisplay}</span>
            ) : (
              <FoodImage
                src={photoDisplay}
                alt={food.name}
                className="w-full h-full object-cover"
              />
            )}
          </div>

          {/* Nombre y marca centrados */}
          <div className="text-center w-full">
            <CardTitle className="text-xl font-bold">{food.name}</CardTitle>
            {food.brand && (
              <p className="text-sm text-muted-foreground mt-1">{food.brand}</p>
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
        {/* Información Nutricional - Vista Compacta con Fibra y Humedad */}
        {hasNutritionData && (
          <div className="space-y-2">
            <h4 className="font-semibold text-xs text-muted-foreground uppercase">
              Nutrición (por 100g)
            </h4>
            <CompactNutritionView food={food} />
          </div>
        )}

        {/* Palatabilidad y Digestibilidad */}
        {(palatability || digestibility) && (
          <div className="space-y-2">
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
            {digestibility && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Digestibilidad:
                </span>
                <Badge variant={getQualityVariant(food.digestibility)}>
                  {digestibility.emoji} {digestibility.label}
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Especies aptas */}
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">Apto para:</span>
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
