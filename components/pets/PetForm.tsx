"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type {
  Pet,
  PetFormData,
  Species,
  MealScheduleFormData,
  PetWithSchedules,
} from "@/types/pets";
import {
  PetFormSchema,
  SPECIES,
  GENDER,
  APPETITE,
  ACTIVITY_LEVEL,
} from "@/types/pets";
import { createPet, updatePet, deletePet } from "@/app/pets/actions";
import {
  generateDefaultSchedule,
  getMealName,
} from "@/lib/utils/meal-schedule";
import { useToast } from "@/hooks/use-toast";
import {
  SPECIES_OPTIONS,
  GENDER_OPTIONS,
  BODY_CONDITION_OPTIONS,
  APPETITE_OPTIONS,
  ACTIVITY_LEVEL_OPTIONS,
  getBreedsBySpecies,
} from "@/lib/constants/pets";
import { getDefaultAvatar } from "@/lib/constants/avatars";
import { AvatarSelector } from "./AvatarSelector";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// ============================================
// TYPES
// ============================================

interface PetFormProps {
  pet?: PetWithSchedules;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convertir Pet (Kysely types) a datos de formulario
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertPetToFormData(pet: Pet): any {
  return {
    name: pet.name,
    species: pet.species as string,
    breed: pet.breed || undefined,
    birth_date: pet.birth_date
      ? new Date(pet.birth_date as unknown as Date).toISOString().split("T")[0]
      : undefined,
    gender: (pet.gender as string) || GENDER.UNKNOWN,
    weight_kg: pet.weight_kg ? Number(pet.weight_kg) : undefined,
    body_condition: (pet.body_condition as string) || undefined,
    daily_food_goal_grams: Number(pet.daily_food_goal_grams),
    daily_meals_target: pet.daily_meals_target
      ? Number(pet.daily_meals_target)
      : 2,
    health_notes: pet.health_notes || undefined,
    allergies: pet.allergies || [],
    medications: pet.medications || [],
    appetite: (pet.appetite as string) || APPETITE.NORMAL,
    activity_level: (pet.activity_level as string) || ACTIVITY_LEVEL.MODERATE,
    photo_url: pet.photo_url || undefined,
  };
}

/**
 * Convertir datos de formulario a FormData para Server Action
 */
function convertToFormData(
  data: PetFormData,
  mealSchedules?: MealScheduleFormData[]
): FormData {
  const formData = new FormData();

  // Básicos
  formData.append("name", data.name);
  formData.append("species", data.species);
  if (data.breed) formData.append("breed", data.breed);
  if (data.birth_date) formData.append("birth_date", data.birth_date);
  formData.append("gender", data.gender);

  // Físico
  if (data.weight_kg != null)
    formData.append("weight_kg", data.weight_kg.toString());
  if (data.body_condition)
    formData.append("body_condition", data.body_condition);

  // Nutrición
  formData.append(
    "daily_food_goal_grams",
    data.daily_food_goal_grams.toString()
  );
  formData.append("daily_meals_target", data.daily_meals_target.toString());

  // Horarios de tomas (nuevo)
  if (mealSchedules && mealSchedules.length > 0) {
    formData.append("meal_schedules", JSON.stringify(mealSchedules));
  }

  // Salud
  if (data.health_notes) formData.append("health_notes", data.health_notes);
  if (data.allergies && data.allergies.length > 0) {
    formData.append("allergies", JSON.stringify(data.allergies));
  }
  if (data.medications && data.medications.length > 0) {
    formData.append("medications", JSON.stringify(data.medications));
  }

  // Comportamiento
  if (data.appetite) formData.append("appetite", data.appetite);
  if (data.activity_level)
    formData.append("activity_level", data.activity_level);

  // Avatar
  if (data.photo_url) formData.append("photo_url", data.photo_url);

  return formData;
}

// ============================================
// COMPONENT
// ============================================

export function PetForm({ pet, onSuccess, onCancel }: PetFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [breeds, setBreeds] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(
    pet?.photo_url || undefined
  );

  // Inicializar meal_schedules: desde pet existente o array vacío
  const [mealSchedules, setMealSchedules] = useState<MealScheduleFormData[]>(
    pet?.meal_schedules?.map((s) => ({
      meal_number: s.meal_number,
      scheduled_time: s.scheduled_time,
      expected_grams: s.expected_grams
        ? Number(s.expected_grams)
        : undefined,
      notes: s.notes || undefined,
    })) || []
  );

  const isEditing = !!pet;

  // Valores por defecto
  const defaultValues: Partial<PetFormData> = {
    name: "",
    species: SPECIES.DOG,
    breed: undefined,
    birth_date: undefined,
    gender: GENDER.UNKNOWN,
    weight_kg: undefined,
    body_condition: undefined,
    daily_food_goal_grams: 200,
    daily_meals_target: 2,
    health_notes: undefined,
    allergies: [],
    medications: [],
    appetite: APPETITE.NORMAL,
    activity_level: ACTIVITY_LEVEL.MODERATE,
  };

  const form = useForm({
    resolver: zodResolver(PetFormSchema),
    defaultValues: isEditing ? convertPetToFormData(pet) : defaultValues,
  });

  // Actualizar breeds cuando species cambia
  const selectedSpecies = form.watch("species");

  useEffect(() => {
    if (selectedSpecies) {
      const availableBreeds = getBreedsBySpecies(selectedSpecies);
      setBreeds([...availableBreeds]); // Convertir readonly a mutable

      // Si la raza actual no está en la lista, limpiarla
      const currentBreed = form.getValues("breed");
      if (currentBreed && !availableBreeds.includes(currentBreed)) {
        form.setValue("breed", undefined);
      }

      // Establecer avatar por defecto si no hay mascota (modo crear)
      if (!pet) {
        const defaultAvatar = getDefaultAvatar(selectedSpecies as Species);
        form.setValue("photo_url", defaultAvatar);
        setPhotoUrl(defaultAvatar);
      }
    }
  }, [selectedSpecies, form, pet]);

  // Sincronizar meal schedules con daily_meals_target
  const dailyMealsTarget = form.watch("daily_meals_target");

  useEffect(() => {
    if (dailyMealsTarget && dailyMealsTarget > 0) {
      // Generar horarios por defecto si el número cambió
      if (mealSchedules.length !== dailyMealsTarget) {
        const defaultSchedules = generateDefaultSchedule(dailyMealsTarget);
        setMealSchedules(defaultSchedules);
      }
    }
  }, [dailyMealsTarget, mealSchedules.length]);

  // Submit handler
  async function onSubmit(data: PetFormData) {
    setIsSubmitting(true);

    try {
      const formData = convertToFormData(data, mealSchedules);
      const result = isEditing
        ? await updatePet(String(pet.id), formData)
        : await createPet(formData);

      if (result.ok) {
        toast({
          title: isEditing ? "Mascota actualizada" : "Mascota creada",
          description: isEditing
            ? "Los cambios se han guardado correctamente."
            : "La mascota ha sido registrada exitosamente.",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });

        // Setear errores de campos si existen
        if (result.fieldErrors) {
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            form.setError(field as keyof PetFormData, {
              type: "server",
              message: errors[0],
            });
          });
        }
      }
    } catch {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al guardar la mascota.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Actualizar hora de una toma específica
   */
  const handleMealScheduleTimeChange = (index: number, newTime: string) => {
    setMealSchedules((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], scheduled_time: newTime };
      return updated;
    });
  };

  /**
   * Actualizar cantidad esperada de una toma específica
   */
  const handleMealScheduleAmountChange = (index: number, newAmount: string) => {
    setMealSchedules((prev) => {
      const updated = [...prev];
      const amount = newAmount ? parseInt(newAmount, 10) : undefined;
      updated[index] = {
        ...updated[index],
        expected_grams: amount && amount > 0 ? amount : undefined,
      };
      return updated;
    });
  };

  /**
   * Manejar eliminación de mascota
   */
  const handleDelete = async () => {
    if (!pet) return;

    setIsDeleting(true);

    try {
      const result = await deletePet(String(pet.id));

      if (result.ok) {
        toast({
          title: "Mascota eliminada",
          description: "La mascota ha sido eliminada correctamente.",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al eliminar la mascota.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Información Básica */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Información Básica</h3>
            <p className="text-sm text-muted-foreground">
              Datos principales de la mascota
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Pelusa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Especie */}
            <FormField
              control={form.control}
              name="species"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Especie *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una especie" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPECIES_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Raza */}
            <FormField
              control={form.control}
              name="breed"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raza</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una raza" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {breeds.map((breed) => (
                        <SelectItem key={breed} value={breed}>
                          {breed}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de nacimiento */}
            <FormField
              control={form.control}
              name="birth_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha de Nacimiento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Género */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Género</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un género" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Información Física */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Información Física</h3>
            <p className="text-sm text-muted-foreground">
              Peso y condición corporal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Peso */}
            <FormField
              control={form.control}
              name="weight_kg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Peso (kg)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="5.50"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value === "" ? undefined : parseFloat(value)
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Condición corporal */}
            <FormField
              control={form.control}
              name="body_condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condición Corporal</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una condición" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BODY_CONDITION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Objetivos Nutricionales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Objetivos Nutricionales</h3>
            <p className="text-sm text-muted-foreground">
              Meta diaria de alimentación
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Meta diaria */}
            <FormField
              control={form.control}
              name="daily_food_goal_grams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta Diaria (gramos) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="200"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Comidas objetivo */}
            <FormField
              control={form.control}
              name="daily_meals_target"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comidas por Día</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2"
                      {...field}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value, 10))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Horarios de Tomas */}
          {mealSchedules.length > 0 && (
            <div className="space-y-3 pt-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Horarios de Tomas</h4>
                <p className="text-xs text-muted-foreground">
                  Define la hora de cada comida del día
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {mealSchedules.map((schedule, index) => (
                  <div
                    key={schedule.meal_number}
                    className="flex flex-col space-y-2 p-3 border rounded-lg"
                  >
                    <label className="text-sm font-medium">
                      {getMealName(schedule.meal_number)}
                    </label>

                    {/* Hora */}
                    <div className="space-y-1">
                      <label
                        htmlFor={`meal-time-${index}`}
                        className="text-xs text-muted-foreground"
                      >
                        Hora
                      </label>
                      <Input
                        id={`meal-time-${index}`}
                        type="time"
                        value={schedule.scheduled_time}
                        onChange={(e) =>
                          handleMealScheduleTimeChange(index, e.target.value)
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Cantidad */}
                    <div className="space-y-1">
                      <label
                        htmlFor={`meal-amount-${index}`}
                        className="text-xs text-muted-foreground"
                      >
                        Cantidad (g)
                      </label>
                      <Input
                        id={`meal-amount-${index}`}
                        type="number"
                        min="1"
                        placeholder="Opcional"
                        value={schedule.expected_grams || ""}
                        onChange={(e) =>
                          handleMealScheduleAmountChange(index, e.target.value)
                        }
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {mealSchedules.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  💡 Tip: Mantén al menos 2-3 horas entre tomas para una mejor
                  digestión
                </p>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Salud */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Salud</h3>
            <p className="text-sm text-muted-foreground">
              Notas médicas y condiciones especiales
            </p>
          </div>

          <div className="space-y-4">
            {/* Notas de salud */}
            <FormField
              control={form.control}
              name="health_notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas de Salud</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones médicas, condiciones especiales..."
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Alergias */}
            <FormField
              control={form.control}
              name="allergies"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Alergias</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Separa con comas: pollo, trigo, soja"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value
                            ? value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : []
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Medicamentos */}
            <FormField
              control={form.control}
              name="medications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medicamentos</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Separa con comas: antihistamínico, suplemento..."
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(
                          value
                            ? value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean)
                            : []
                        );
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Avatar */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Avatar</h3>
            <p className="text-sm text-muted-foreground">
              Selecciona un emoji o sube una foto de tu mascota
            </p>
          </div>

          <FormField
            control={form.control}
            name="photo_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Avatar de la mascota</FormLabel>
                <FormControl>
                  <AvatarSelector
                    species={form.watch("species") as Species}
                    currentAvatar={field.value}
                    onAvatarChange={(avatar) => {
                      field.onChange(avatar);
                      setPhotoUrl(avatar);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Comportamiento */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Comportamiento</h3>
            <p className="text-sm text-muted-foreground">
              Apetito y nivel de actividad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Apetito */}
            <FormField
              control={form.control}
              name="appetite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apetito</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona nivel de apetito" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {APPETITE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nivel de actividad */}
            <FormField
              control={form.control}
              name="activity_level"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nivel de Actividad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona nivel de actividad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ACTIVITY_LEVEL_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex gap-4 justify-between">
          {/* Botón eliminar (solo en edición) */}
          {isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isSubmitting || isDeleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Eliminar Mascota
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará
                    permanentemente la mascota <strong>{pet?.name}</strong> y
                    todos sus datos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={isDeleting}>
                    Cancelar
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Botones de guardar/cancelar */}
          <div className="flex gap-4 ml-auto">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting || isDeleting}
              >
                Cancelar
              </Button>
            )}

            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Guardar Cambios" : "Crear Mascota"}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
