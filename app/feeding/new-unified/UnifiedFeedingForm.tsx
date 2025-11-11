"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Loader2, UtensilsCrossed } from "lucide-react";
import { createMultiPetFeeding } from "../actions";

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
  enabled: boolean;
  isOpen: boolean;
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

interface UnifiedFeedingFormProps {
  pets: Pet[];
  foods: Food[];
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export function UnifiedFeedingForm({ pets, foods }: UnifiedFeedingFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Datos comunes
  const [foodId, setFoodId] = useState("");
  const [feedingDate, setFeedingDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [feedingTime, setFeedingTime] = useState(format(new Date(), "HH:mm"));

  // Datos por mascota (Map<petId, data>)
  const [petData, setPetData] = useState<Map<string, PetFeedingData>>(() => {
    const map = new Map<string, PetFeedingData>();
    pets.forEach((pet) => {
      const suggestedAmount = Math.round(
        pet.daily_food_goal_grams / (pet.daily_meals_target || 2)
      );
      map.set(pet.id, {
        enabled: false,
        isOpen: false,
        amount_served_grams: suggestedAmount.toString(),
        amount_eaten_grams: suggestedAmount.toString(),
        appetite_rating: "normal",
        eating_speed: "normal",
        vomited: false,
        had_diarrhea: false,
        had_stool: false,
        stool_quality: "normal",
        notes: "",
      });
    });
    return map;
  });

  // Actualizar dato de una mascota
  const updatePetData = (
    petId: string,
    field: keyof PetFeedingData,
    value: string | boolean
  ) => {
    setPetData((prev) => {
      const newMap = new Map(prev);
      const data = newMap.get(petId)!;
      newMap.set(petId, { ...data, [field]: value });
      return newMap;
    });
  };

  // Toggle mascota
  const togglePet = (petId: string) => {
    updatePetData(petId, "enabled", !petData.get(petId)!.enabled);
  };

  // Toggle collapsible
  const toggleOpen = (petId: string) => {
    updatePetData(petId, "isOpen", !petData.get(petId)!.isOpen);
  };

  // Calcular sobras automáticamente
  const calculateLeftover = (petId: string, served: string, eaten: string) => {
    const s = parseInt(served) || 0;
    const e = parseInt(eaten) || 0;
    return Math.max(0, s - e);
  };

  // Validar y enviar
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validar que al menos una mascota esté seleccionada
    const enabledPets = Array.from(petData.entries()).filter(
      ([, data]) => data.enabled
    );

    if (enabledPets.length === 0) {
      toast.error("Selecciona al menos una mascota");
      return;
    }

    if (!foodId) {
      toast.error("Selecciona un alimento");
      return;
    }

    // Construir FormData con estructura indexed
    const formData = new FormData();
    formData.append("food_id", foodId);
    formData.append("feeding_date", feedingDate);
    formData.append("feeding_time", feedingTime);

    // Solo incluir mascotas habilitadas
    const selectedPetIds: string[] = [];
    enabledPets.forEach(([petId, data], index) => {
      selectedPetIds.push(petId);

      // Indexed data
      formData.append(`amount_served_grams_${index}`, data.amount_served_grams);
      formData.append(`amount_eaten_grams_${index}`, data.amount_eaten_grams);
      formData.append(`appetite_rating_${index}`, data.appetite_rating);
      formData.append(`eating_speed_${index}`, data.eating_speed);
      formData.append(`vomited_${index}`, data.vomited ? "true" : "false");
      formData.append(
        `had_diarrhea_${index}`,
        data.had_diarrhea ? "true" : "false"
      );
      formData.append(`had_stool_${index}`, data.had_stool ? "true" : "false");
      formData.append(`stool_quality_${index}`, data.stool_quality);
      formData.append(`notes_${index}`, data.notes);
    });

    // Pet IDs array
    formData.append("pet_ids", JSON.stringify(selectedPetIds));

    // Enviar
    startTransition(async () => {
      const result = await createMultiPetFeeding(formData);

      if (result.ok) {
        toast.success(
          `${enabledPets.length} registro${
            enabledPets.length > 1 ? "s" : ""
          } creado${enabledPets.length > 1 ? "s" : ""} exitosamente`
        );
        router.push("/feeding");
        router.refresh();
      } else {
        toast.error(result.message);
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            errors.forEach((error) => toast.error(`${field}: ${error}`));
          });
        }
      }
    });
  };

  const enabledCount = Array.from(petData.values()).filter(
    (d) => d.enabled
  ).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <UtensilsCrossed className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Registrar Alimentación
          </h1>
          <p className="text-muted-foreground">
            Selecciona las mascotas y registra su comida
          </p>
        </div>
      </div>

      {/* Datos Comunes */}
      <Card>
        <CardHeader>
          <CardTitle>Datos Comunes</CardTitle>
          <CardDescription>
            Información compartida para todos los registros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Alimento */}
          <div className="space-y-2">
            <Label htmlFor="food_id">
              Alimento <span className="text-destructive">*</span>
            </Label>
            <Select value={foodId} onValueChange={setFoodId} required>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un alimento" />
              </SelectTrigger>
              <SelectContent>
                {foods.map((food) => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.name}
                    {food.brand && ` - ${food.brand}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Fecha y Hora */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="feeding_date">
                Fecha <span className="text-destructive">*</span>
              </Label>
              <Input
                id="feeding_date"
                type="date"
                value={feedingDate}
                onChange={(e) => setFeedingDate(e.target.value)}
                max={format(new Date(), "yyyy-MM-dd")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feeding_time">Hora</Label>
              <Input
                id="feeding_time"
                type="time"
                value={feedingTime}
                onChange={(e) => setFeedingTime(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selección de Mascotas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Mascotas</CardTitle>
              <CardDescription>
                Selecciona las mascotas que comieron ({enabledCount}/
                {pets.length})
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {pets.map((pet) => {
            const data = petData.get(pet.id)!;
            return (
              <Collapsible
                key={pet.id}
                open={data.isOpen}
                onOpenChange={() => toggleOpen(pet.id)}
              >
                <Card className={data.enabled ? "border-primary" : ""}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`pet-${pet.id}`}
                          checked={data.enabled}
                          onCheckedChange={() => togglePet(pet.id)}
                        />
                        <div>
                          <CardTitle className="text-base">
                            {pet.name}
                          </CardTitle>
                          <CardDescription className="text-sm">
                            {pet.species}
                            {pet.breed && ` - ${pet.breed}`}
                          </CardDescription>
                        </div>
                      </div>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={!data.enabled}
                        >
                          {data.isOpen ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                  </CardHeader>

                  <CollapsibleContent>
                    <CardContent className="space-y-4 pt-0">
                      {/* Cantidades */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`served-${pet.id}`}>
                            Servido (g){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`served-${pet.id}`}
                            type="number"
                            min="0"
                            value={data.amount_served_grams}
                            onChange={(e) => {
                              updatePetData(
                                pet.id,
                                "amount_served_grams",
                                e.target.value
                              );
                            }}
                            disabled={!data.enabled}
                            required={data.enabled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`eaten-${pet.id}`}>
                            Comido (g){" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`eaten-${pet.id}`}
                            type="number"
                            min="0"
                            value={data.amount_eaten_grams}
                            onChange={(e) => {
                              updatePetData(
                                pet.id,
                                "amount_eaten_grams",
                                e.target.value
                              );
                            }}
                            disabled={!data.enabled}
                            required={data.enabled}
                          />
                          <p className="text-xs text-muted-foreground">
                            Sobra:{" "}
                            {calculateLeftover(
                              pet.id,
                              data.amount_served_grams,
                              data.amount_eaten_grams
                            )}
                            g
                          </p>
                        </div>
                      </div>

                      {/* Comportamiento */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`appetite-${pet.id}`}>Apetito</Label>
                          <Select
                            value={data.appetite_rating}
                            onValueChange={(v) =>
                              updatePetData(pet.id, "appetite_rating", v)
                            }
                            disabled={!data.enabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="refused">Rechazó</SelectItem>
                              <SelectItem value="poor">Pobre</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="good">Bueno</SelectItem>
                              <SelectItem value="excellent">
                                Excelente
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`speed-${pet.id}`}>Velocidad</Label>
                          <Select
                            value={data.eating_speed}
                            onValueChange={(v) =>
                              updatePetData(pet.id, "eating_speed", v)
                            }
                            disabled={!data.enabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="very_slow">
                                Muy lento
                              </SelectItem>
                              <SelectItem value="slow">Lento</SelectItem>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="fast">Rápido</SelectItem>
                              <SelectItem value="very_fast">
                                Muy rápido
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Resultados digestivos */}
                      <div className="space-y-2">
                        <Label>Resultados</Label>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`vomited-${pet.id}`}
                              checked={data.vomited}
                              onCheckedChange={(checked) =>
                                updatePetData(pet.id, "vomited", checked)
                              }
                              disabled={!data.enabled}
                            />
                            <Label
                              htmlFor={`vomited-${pet.id}`}
                              className="font-normal"
                            >
                              Vomitó
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`diarrhea-${pet.id}`}
                              checked={data.had_diarrhea}
                              onCheckedChange={(checked) =>
                                updatePetData(pet.id, "had_diarrhea", checked)
                              }
                              disabled={!data.enabled}
                            />
                            <Label
                              htmlFor={`diarrhea-${pet.id}`}
                              className="font-normal"
                            >
                              Diarrea
                            </Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`stool-${pet.id}`}
                              checked={data.had_stool}
                              onCheckedChange={(checked) =>
                                updatePetData(pet.id, "had_stool", checked)
                              }
                              disabled={!data.enabled}
                            />
                            <Label
                              htmlFor={`stool-${pet.id}`}
                              className="font-normal"
                            >
                              Hizo caca
                            </Label>
                          </div>
                        </div>
                      </div>

                      {/* Calidad de heces */}
                      {data.had_stool && (
                        <div className="space-y-2">
                          <Label htmlFor={`stool-quality-${pet.id}`}>
                            Calidad de heces
                          </Label>
                          <Select
                            value={data.stool_quality}
                            onValueChange={(v) =>
                              updatePetData(pet.id, "stool_quality", v)
                            }
                            disabled={!data.enabled}
                          >
                            <SelectTrigger>
                              <SelectValue />
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

                      {/* Notas */}
                      <div className="space-y-2">
                        <Label htmlFor={`notes-${pet.id}`}>Notas</Label>
                        <Textarea
                          id={`notes-${pet.id}`}
                          placeholder="Observaciones adicionales..."
                          value={data.notes}
                          onChange={(e) =>
                            updatePetData(pet.id, "notes", e.target.value)
                          }
                          disabled={!data.enabled}
                          rows={2}
                        />
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>

      {/* Botones */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isPending || enabledCount === 0}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar {enabledCount > 0 && `(${enabledCount})`}
        </Button>
      </div>
    </form>
  );
}
