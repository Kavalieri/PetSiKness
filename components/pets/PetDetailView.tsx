"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Edit, Trash2, Heart, Activity, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PetDeleteDialog } from "@/components/pets/PetDeleteDialog";
import type { Pet } from "@/types/pets";
import {
  SPECIES_LABELS,
  GENDER_LABELS,
  BODY_CONDITION_LABELS,
  BODY_CONDITION_EMOJIS,
  APPETITE_LABELS,
  ACTIVITY_LEVEL_LABELS,
} from "@/lib/constants/pets";

// ============================================
// HELPERS
// ============================================

/**
 * Calcular edad desde fecha de nacimiento
 */
function calculateAge(birthDate: Date | string | null): string {
  if (!birthDate) return "Edad desconocida";

  const today = new Date();
  const birth = new Date(birthDate);
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();

  if (years === 0) {
    if (months === 0) return "Menos de 1 mes";
    return months === 1 ? "1 mes" : `${months} meses`;
  }

  return years === 1 ? "1 año" : `${years} años`;
}

/**
 * Formatear fecha en español
 */
function formatDate(date: Date | string | null): string {
  if (!date) return "N/A";

  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ============================================
// TYPES
// ============================================

interface PetDetailViewProps {
  pet: Pet;
  onDeleteSuccess?: () => void;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Vista detallada de mascota con toda la información
 *
 * Muestra información completa organizada en secciones:
 * - Header con avatar y datos principales
 * - Información básica (especie, raza, género, nacimiento)
 * - Información física (peso, condición corporal)
 * - Objetivos nutricionales (meta diaria, comidas)
 * - Salud (notas, alergias, medicamentos)
 * - Comportamiento (apetito, actividad)
 *
 * Incluye botones de acción: Volver, Editar, Eliminar
 */
export function PetDetailView({ pet, onDeleteSuccess }: PetDetailViewProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Formatear datos
  const speciesLabel =
    SPECIES_LABELS[pet.species as keyof typeof SPECIES_LABELS] || pet.species;
  const genderLabel = pet.gender
    ? GENDER_LABELS[pet.gender as keyof typeof GENDER_LABELS]
    : "N/A";
  const bodyConditionLabel = pet.body_condition
    ? BODY_CONDITION_LABELS[
        pet.body_condition as keyof typeof BODY_CONDITION_LABELS
      ]
    : "N/A";
  const bodyConditionEmoji = pet.body_condition
    ? BODY_CONDITION_EMOJIS[
        pet.body_condition as keyof typeof BODY_CONDITION_EMOJIS
      ]
    : "";
  const appetiteLabel = pet.appetite
    ? APPETITE_LABELS[pet.appetite as keyof typeof APPETITE_LABELS]
    : "N/A";
  const activityLabel = pet.activity_level
    ? ACTIVITY_LEVEL_LABELS[
        pet.activity_level as keyof typeof ACTIVITY_LEVEL_LABELS
      ]
    : "N/A";

  const age = calculateAge(pet.birth_date as Date | string | null);
  const birthDateFormatted = formatDate(pet.birth_date as Date | string | null);

  return (
    <div className="space-y-6">
      {/* Barra superior - Volver */}
      <div className="flex items-center gap-2">
        <Link href="/pets">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </Link>
      </div>

      {/* Header Section */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {pet.photo_url ? (
          <div className="flex-shrink-0 w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 relative">
            <Image
              src={pet.photo_url}
              alt={`Foto de ${pet.name}`}
              fill
              className="object-cover"
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-24 h-24 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-4xl font-bold">
            {pet.name.charAt(0).toUpperCase()}
          </div>
        )}

        {/* Nombre y datos principales */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold mb-2">{pet.name}</h2>
          <div className="flex flex-wrap gap-2 text-muted-foreground">
            <span>{speciesLabel}</span>
            <span>•</span>
            <span>{age}</span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Grid de información */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Especie</p>
              <p className="text-base font-medium">{speciesLabel}</p>
            </div>

            {pet.breed && (
              <div>
                <p className="text-sm text-muted-foreground">Raza</p>
                <p className="text-base font-medium">{pet.breed}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">Género</p>
              <Badge variant="secondary">{genderLabel}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Fecha de nacimiento
              </p>
              <p className="text-base">{birthDateFormatted}</p>
              <p className="text-sm text-muted-foreground">({age})</p>
            </div>
          </CardContent>
        </Card>

        {/* Información Física */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Información Física
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pet.weight_kg && (
              <div>
                <p className="text-sm text-muted-foreground">Peso</p>
                <p className="text-2xl font-bold">{Number(pet.weight_kg)} kg</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground">
                Condición corporal
              </p>
              <Badge variant="outline">
                {bodyConditionEmoji} {bodyConditionLabel}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Objetivos Nutricionales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Apple className="h-5 w-5" />
              Objetivos Nutricionales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Meta diaria de comida
              </p>
              <p className="text-2xl font-bold">
                {Number(pet.daily_food_goal_grams)} g
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">
                Raciones por día (objetivo)
              </p>
              <p className="text-base font-medium">
                {pet.daily_meals_target ? Number(pet.daily_meals_target) : 2}{" "}
                raciones
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Salud */}
        <Card>
          <CardHeader>
            <CardTitle>Salud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {pet.health_notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Notas de salud
                </p>
                <p className="text-sm">{pet.health_notes}</p>
              </div>
            )}

            <div>
              <p className="text-sm text-muted-foreground mb-2">Alergias</p>
              {pet.allergies && pet.allergies.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {pet.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive">
                      {allergy}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin alergias registradas
                </p>
              )}
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">Medicamentos</p>
              {pet.medications && pet.medications.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {pet.medications.map((medication, idx) => (
                    <Badge key={idx} variant="secondary">
                      {medication}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Sin medicamentos registrados
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comportamiento - Full width */}
      <Card>
        <CardHeader>
          <CardTitle>Comportamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Apetito</p>
              <Badge variant="outline">{appetiteLabel}</Badge>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Nivel de actividad
              </p>
              <Badge variant="outline">{activityLabel}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href={`/pets/${String(pet.id)}/edit`} className="flex-1">
          <Button className="w-full">
            <Edit className="h-4 w-4 mr-2" />
            Editar Mascota
          </Button>
        </Link>

        <Button
          variant="destructive"
          onClick={() => setDeleteDialogOpen(true)}
          className="flex-1"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar Mascota
        </Button>
      </div>

      {/* Delete Dialog */}
      <PetDeleteDialog
        pet={pet}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onSuccess={onDeleteSuccess}
      />
    </div>
  );
}
