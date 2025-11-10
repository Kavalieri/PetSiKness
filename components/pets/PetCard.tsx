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
      {/* Header */}
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {avatar.type === "emoji" ? (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-4xl border-2 border-border">
                {avatar.value}
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
                <img
                  src={avatar.value}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>

          {/* Nombre y especie */}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-xl font-bold truncate">
              {pet.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {speciesLabel}
              {pet.breed && ` • ${pet.breed}`}
            </p>
          </div>
        </div>
      </CardHeader>

      {/* Content */}
      <CardContent className="pb-3 space-y-2">
        {/* Edad */}
        {age && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Edad:</span>
            <span className="font-medium">{age}</span>
          </div>
        )}

        {/* Peso */}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Peso:</span>
          <span className="font-medium">{weight}</span>
        </div>

        {/* Condición corporal */}
        {pet.body_condition && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Condición:</span>
            <Badge variant={getBodyConditionVariant(pet.body_condition)}>
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
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Meta diaria:</span>
          <span className="font-medium">{dailyGoal}</span>
        </div>
      </CardContent>

      {/* Footer - Botones de acción */}
      <CardFooter className="pt-3 border-t flex gap-2">
        {/* Ver detalle */}
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/pets/${petId}`}>
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Link>
        </Button>

        {/* Editar */}
        <Button variant="outline" size="sm" asChild className="flex-1">
          <Link href={`/pets/${petId}/edit`}>
            <Pencil className="h-4 w-4 mr-1" />
            Editar
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
            <Trash2 className="h-4 w-4 mr-1" />
            Eliminar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
