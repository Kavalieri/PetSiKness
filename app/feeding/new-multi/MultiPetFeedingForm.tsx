"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMultiPetFeeding } from "../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PawPrint, Save } from "lucide-react";

// ============================================
// TIPOS
// ============================================

interface Pet {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  daily_food_goal_grams: number;
  daily_meals_target: number;
}

interface Food {
  id: string;
  name: string;
  brand: string | null;
}

interface PetFeedingData {
  amount_served_grams: string;
  amount_eaten_grams: string;
  appetite_rating: string;
  eating_speed: string;
  vomited: boolean;
  had_diarrhea: boolean;
  had_stool: boolean;
  stool_quality: string;
  notes: string;
}

interface MultiPetFeedingFormProps {
  pets: Pet[];
  foods: Food[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function MultiPetFeedingForm({ pets, foods }: MultiPetFeedingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Estados para datos comunes
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());
  const [foodId, setFoodId] = useState<string>("");
  const [feedingDate, setFeedingDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [feedingTime, setFeedingTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );

  // Estado para datos individuales por mascota
  const [petData, setPetData] = useState<Map<string, PetFeedingData>>(
    new Map()
  );

  // Toggle mascota seleccionada
  const togglePet = (petId: string) => {
    const newSelected = new Set(selectedPets);
    if (newSelected.has(petId)) {
      newSelected.delete(petId);
      const newPetData = new Map(petData);
      newPetData.delete(petId);
      setPetData(newPetData);
    } else {
      newSelected.add(petId);
      // Inicializar con valores por defecto
      const pet = pets.find((p) => p.id === petId);
      const suggestedAmount = pet
        ? Math.round(pet.daily_food_goal_grams / pet.daily_meals_target)
        : 50;

      const newPetData = new Map(petData);
      newPetData.set(petId, {
        amount_served_grams: suggestedAmount.toString(),
        amount_eaten_grams: suggestedAmount.toString(),
        appetite_rating: "",
        eating_speed: "",
        vomited: false,
        had_diarrhea: false,
        had_stool: false,
        stool_quality: "",
        notes: "",
      });
      setPetData(newPetData);
    }
    setSelectedPets(newSelected);
  };

  // Seleccionar todas
  const selectAll = () => {
    const allIds = new Set(pets.map((p) => p.id));
    setSelectedPets(allIds);

    const newPetData = new Map<string, PetFeedingData>();
    pets.forEach((pet) => {
      if (!petData.has(pet.id)) {
        const suggestedAmount = Math.round(
          pet.daily_food_goal_grams / pet.daily_meals_target
        );
        newPetData.set(pet.id, {
          amount_served_grams: suggestedAmount.toString(),
          amount_eaten_grams: suggestedAmount.toString(),
          appetite_rating: "",
          eating_speed: "",
          vomited: false,
          had_diarrhea: false,
          had_stool: false,
          stool_quality: "",
          notes: "",
        });
      } else {
        newPetData.set(pet.id, petData.get(pet.id)!);
      }
    });
    setPetData(newPetData);
  };

  // Deseleccionar todas
  const deselectAll = () => {
    setSelectedPets(new Set());
    setPetData(new Map());
  };

  // Actualizar dato individual de mascota
  const updatePetData = (
    petId: string,
    field: keyof PetFeedingData,
    value: string | boolean
  ) => {
    const newPetData = new Map(petData);
    const current = newPetData.get(petId) || {
      amount_served_grams: "",
      amount_eaten_grams: "",
      appetite_rating: "",
      eating_speed: "",
      vomited: false,
      had_diarrhea: false,
      had_stool: false,
      stool_quality: "",
      notes: "",
    };

    newPetData.set(petId, { ...current, [field]: value });
    setPetData(newPetData);
  };

  // Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (selectedPets.size === 0) {
      toast.error("Selecciona al menos una mascota");
      return;
    }

    if (!foodId) {
      toast.error("Selecciona un alimento");
      return;
    }

    const formData = new FormData();

    // Datos comunes
    formData.append("food_id", foodId);
    formData.append("feeding_date", feedingDate);
    formData.append("feeding_time", feedingTime);

    // Pet IDs y datos individuales
    const petIdsArray = Array.from(selectedPets);
    petIdsArray.forEach((petId, index) => {
      formData.append("pet_ids", petId);

      const data = petData.get(petId)!;
      formData.append(`amount_served_grams_${index}`, data.amount_served_grams);
      formData.append(`amount_eaten_grams_${index}`, data.amount_eaten_grams);
      formData.append(`appetite_rating_${index}`, data.appetite_rating);
      formData.append(`eating_speed_${index}`, data.eating_speed);
      formData.append(`vomited_${index}`, data.vomited.toString());
      formData.append(`had_diarrhea_${index}`, data.had_diarrhea.toString());
      formData.append(`had_stool_${index}`, data.had_stool.toString());
      formData.append(`stool_quality_${index}`, data.stool_quality);
      formData.append(`notes_${index}`, data.notes);
    });

    startTransition(async () => {
      const result = await createMultiPetFeeding(formData);

      if (result.ok) {
        toast.success(
          `${
            result.data?.count || selectedPets.size
          } alimentaciones registradas`
        );
        router.push("/feeding");
        router.refresh();
      } else {
        toast.error(result.message || "Error al registrar");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Registro Multi-Mascota
        </h1>
        <p className="text-muted-foreground">
          Registra la misma comida para múltiples mascotas con cantidades
          individuales
        </p>
      </div>

      {/* Selección de mascotas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="h-5 w-5" />
              Mascotas en esta toma
              {selectedPets.size > 0 && (
                <Badge variant="secondary">
                  {selectedPets.size} seleccionada
                  {selectedPets.size !== 1 ? "s" : ""}
                </Badge>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
              >
                Todas
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={deselectAll}
              >
                Ninguna
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pets.map((pet) => (
              <div
                key={pet.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedPets.has(pet.id)
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted"
                }`}
                onClick={() => togglePet(pet.id)}
              >
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedPets.has(pet.id)}
                    onCheckedChange={() => togglePet(pet.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{pet.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pet.species}
                      {pet.breed && ` · ${pet.breed}`}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Meta: {pet.daily_food_goal_grams}g /{" "}
                      {pet.daily_meals_target} comidas
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Datos comunes */}
      {selectedPets.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Información de la Toma</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            {/* Alimento */}
            <div className="space-y-2">
              <Label htmlFor="food_id">
                Alimento <span className="text-destructive">*</span>
              </Label>
              <Select value={foodId} onValueChange={setFoodId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona alimento" />
                </SelectTrigger>
                <SelectContent>
                  {foods.map((food) => (
                    <SelectItem key={food.id} value={food.id}>
                      {food.brand ? `${food.brand} - ` : ""}
                      {food.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha */}
            <div className="space-y-2">
              <Label htmlFor="feeding_date">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                type="date"
                value={feedingDate}
                onChange={(e) => setFeedingDate(e.target.value)}
                required
              />
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label htmlFor="feeding_time">Hora</Label>
              <Input
                type="time"
                value={feedingTime}
                onChange={(e) => setFeedingTime(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Datos individuales por mascota */}
      {Array.from(selectedPets).map((petId) => {
        const pet = pets.find((p) => p.id === petId)!;
        const data = petData.get(petId)!;

        return (
          <Card key={petId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-4 w-4" />
                {pet.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Cantidades */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Servido (gramos) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    value={data.amount_served_grams}
                    onChange={(e) =>
                      updatePetData(
                        petId,
                        "amount_served_grams",
                        e.target.value
                      )
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>
                    Comido (gramos) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={data.amount_eaten_grams}
                    onChange={(e) =>
                      updatePetData(petId, "amount_eaten_grams", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              {/* Comportamiento */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Apetito</Label>
                  <Select
                    value={data.appetite_rating}
                    onValueChange={(value) =>
                      updatePetData(petId, "appetite_rating", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refused">Rechazó</SelectItem>
                      <SelectItem value="poor">Pobre</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="good">Bueno</SelectItem>
                      <SelectItem value="excellent">Excelente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Velocidad</Label>
                  <Select
                    value={data.eating_speed}
                    onValueChange={(value) =>
                      updatePetData(petId, "eating_speed", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="very_slow">Muy lento</SelectItem>
                      <SelectItem value="slow">Lento</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="fast">Rápido</SelectItem>
                      <SelectItem value="very_fast">Muy rápido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Resultados digestivos */}
              <div className="space-y-3">
                <Label>Resultados</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={data.vomited}
                      onCheckedChange={(checked) =>
                        updatePetData(petId, "vomited", checked as boolean)
                      }
                    />
                    <Label className="font-normal">Vómito</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={data.had_diarrhea}
                      onCheckedChange={(checked) =>
                        updatePetData(petId, "had_diarrhea", checked as boolean)
                      }
                    />
                    <Label className="font-normal">Diarrea</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={data.had_stool}
                      onCheckedChange={(checked) =>
                        updatePetData(petId, "had_stool", checked as boolean)
                      }
                    />
                    <Label className="font-normal">Deposición</Label>
                  </div>
                </div>

                {data.had_stool && (
                  <div className="space-y-2">
                    <Label>Calidad de heces</Label>
                    <Select
                      value={data.stool_quality}
                      onValueChange={(value) =>
                        updatePetData(petId, "stool_quality", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="liquid">Líquida</SelectItem>
                        <SelectItem value="soft">Blanda</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="hard">Dura</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {/* Notas */}
              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  placeholder="Observaciones específicas para esta mascota..."
                  value={data.notes}
                  onChange={(e) =>
                    updatePetData(petId, "notes", e.target.value)
                  }
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Botones de acción */}
      {selectedPets.size > 0 && (
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending || !foodId}>
            <Save className="h-4 w-4 mr-2" />
            {isPending
              ? "Guardando..."
              : `Registrar ${selectedPets.size} alimentación${
                  selectedPets.size !== 1 ? "es" : ""
                }`}
          </Button>
        </div>
      )}
    </form>
  );
}
