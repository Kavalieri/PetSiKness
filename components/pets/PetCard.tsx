import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import type { Pet } from "@/types/pets";
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
  SPECIES_LABELS,
  BODY_CONDITION_LABELS,
  BODY_CONDITION_EMOJIS,
  calculateAge,
  formatWeight,
  formatDailyGoal,
} from "@/lib/constants/pets";
import { getAvatarDisplay } from "@/lib/constants/avatars";
import { BODY_CONDITION, type Species } from "@/types/pets";

// ============================================
// TYPES
// ============================================

interface PetCardProps {
  pet: Pet;
  onDelete?: (id: string) => void;
}

// ============================================
// HELPER: Badge variant por condición corporal
// ============================================

function getBodyConditionVariant(
  condition: string | null
): "default" | "secondary" | "destructive" | "outline" {
  switch (condition) {
    case BODY_CONDITION.UNDERWEIGHT:
      return "secondary"; // Amarillo/warning
    case BODY_CONDITION.IDEAL:
      return "default"; // Verde/success (default en tema)
    case BODY_CONDITION.OVERWEIGHT:
      return "secondary"; // Naranja/warning
    case BODY_CONDITION.OBESE:
      return "destructive"; // Rojo
    default:
      return "outline";
  }
}

// ============================================
// COMPONENT
// ============================================

export function PetCard({ pet, onDelete }: PetCardProps) {
  const speciesLabel =
    SPECIES_LABELS[pet.species as keyof typeof SPECIES_LABELS] || pet.species;

  // Obtener avatar del pet
  const avatar = getAvatarDisplay(pet.photo_url, pet.species as Species);

  // Convertir tipos Kysely a tipos simples
  const birthDateStr = pet.birth_date
    ? new Date(pet.birth_date as unknown as Date).toISOString()
    : null;
  const weightNum = pet.weight_kg ? Number(pet.weight_kg) : null;
  const dailyGoalNum = Number(pet.daily_food_goal_grams);
  const petId = String(pet.id);

  const age = calculateAge(birthDateStr);
  const weight = formatWeight(weightNum);
  const dailyGoal = formatDailyGoal(dailyGoalNum);

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {/* Header con avatar centrado estilo DNI */}
      <CardHeader className="pb-2 sm:pb-3">
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          {/* Avatar grande centrado */}
          <div className="flex-shrink-0">
            {avatar.type === "emoji" ? (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-muted flex items-center justify-center text-5xl sm:text-6xl border-2 border-border shadow-sm">
                {avatar.value}
              </div>
            ) : (
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-primary shadow-md">
                <img
                  src={avatar.value}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Nombre y especie centrados */}
          <div className="text-center w-full">
            <CardTitle className="text-lg sm:text-xl font-bold truncate">
              {pet.name}
            </CardTitle>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {speciesLabel}
              {pet.breed && ` • ${pet.breed}`}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="pb-2 sm:pb-3 space-y-1.5 sm:space-y-2">
        {/* Edad */}
        {age && (
          <div className="flex justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">Edad:</span>
            <span className="font-medium">{age}</span>
          </div>
        )}

        {/* Peso */}
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Peso:</span>
          <span className="font-medium">{weight}</span>
        </div>

        {/* Condición corporal */}
        {pet.body_condition && (
          <div className="flex justify-between items-center text-xs sm:text-sm">
            <span className="text-muted-foreground">Condición:</span>
            <Badge
              variant={getBodyConditionVariant(pet.body_condition)}
              className="text-xs"
            >
              {
                BODY_CONDITION_EMOJIS[
                  pet.body_condition as keyof typeof BODY_CONDITION_EMOJIS
                ]
              }{" "}
              {
                BODY_CONDITION_LABELS[
                  pet.body_condition as keyof typeof BODY_CONDITION_LABELS
                ]
              }
            </Badge>
          </div>
        )}

        {/* Meta diaria */}
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">Meta diaria:</span>
          <span className="font-medium">{dailyGoal}</span>
        </div>
      </CardContent>

      {/* Footer - Botones de acción */}
      <CardFooter className="pt-2 sm:pt-3 border-t flex gap-2">
        {/* Ver detalle */}
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/pets/${petId}`}>
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs sm:text-sm">Ver</span>
          </Link>
        </Button>

        {/* Editar */}
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/pets/${petId}/edit`}>
            <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs sm:text-sm">Editar</span>
          </Link>
        </Button>

        {/* Eliminar */}
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(petId)}
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
            <span className="text-xs sm:text-sm">Eliminar</span>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
