"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Foods } from "@/types/database.generated";
import { FoodFormSchema } from "@/lib/schemas/food";
import type { FoodFormData } from "@/types/foods";
import { createFood, updateFood, deleteFood } from "@/app/foods/actions";
import { useToast } from "@/hooks/use-toast";
import {
  FOOD_TYPE_OPTIONS,
  QUALITY_OPTIONS,
  SPECIES_OPTIONS,
  AGE_RANGE_OPTIONS,
} from "@/lib/constants/foods";
import {
  Form,
  FormControl,
  FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Trash2, AlertCircle } from "lucide-react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";

// ============================================
// TYPES
// ============================================

interface FoodFormProps {
  food?: Foods;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ============================================
// HELPERS
// ============================================

/**
 * Convertir Food (Kysely types) a datos de formulario
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertFoodToFormData(food: Foods): any {
  return {
    name: food.name,
    brand: food.brand ? String(food.brand) : undefined,
    food_type: String(food.food_type),
    calories_per_100g: food.calories_per_100g
      ? Number(food.calories_per_100g)
      : undefined,
    protein_percentage: food.protein_percentage
      ? Number(food.protein_percentage)
      : undefined,
    fat_percentage: food.fat_percentage
      ? Number(food.fat_percentage)
      : undefined,
    carbs_percentage: food.carbs_percentage
      ? Number(food.carbs_percentage)
      : undefined,
    fiber_percentage: food.fiber_percentage
      ? Number(food.fiber_percentage)
      : undefined,
    moisture_percentage: food.moisture_percentage
      ? Number(food.moisture_percentage)
      : undefined,
    ingredients: food.ingredients ? String(food.ingredients) : undefined,
    serving_size_grams: food.serving_size_grams
      ? Number(food.serving_size_grams)
      : undefined,
    package_size_grams: food.package_size_grams
      ? Number(food.package_size_grams)
      : undefined,
    price_per_package: food.price_per_package
      ? Number(food.price_per_package)
      : undefined,
    palatability: food.palatability ? String(food.palatability) : undefined,
    digestibility: food.digestibility ? String(food.digestibility) : undefined,
    suitable_for_species: ((food.suitable_for_species || []) as unknown) as string[],
    age_range: food.age_range ? String(food.age_range) : undefined,
  };
}

// ============================================
// COMPONENT
// ============================================

export function FoodForm({ food, onSuccess, onCancel }: FoodFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditing = !!food;

  // Valores por defecto
  const defaultValues: Partial<FoodFormData> = {
    name: "",
    food_type: "dry",
    brand: undefined,
    calories_per_100g: undefined,
    protein_percentage: undefined,
    fat_percentage: undefined,
    carbs_percentage: undefined,
    fiber_percentage: undefined,
    moisture_percentage: undefined,
    ingredients: undefined,
    serving_size_grams: undefined,
    package_size_grams: undefined,
    price_per_package: undefined,
    palatability: undefined,
    digestibility: undefined,
    suitable_for_species: [],
    age_range: undefined,
  };

  const form = useForm<FoodFormData>({
    resolver: zodResolver(FoodFormSchema),
    defaultValues: isEditing ? convertFoodToFormData(food) : defaultValues,
  });

  // Calcular suma de macros
  const proteinPct = form.watch("protein_percentage") || 0;
  const fatPct = form.watch("fat_percentage") || 0;
  const carbsPct = form.watch("carbs_percentage") || 0;
  const totalMacros = proteinPct + fatPct + carbsPct;

  // Submit handler
  async function onSubmit(data: FoodFormData) {
    setIsSubmitting(true);

    try {
      const result = isEditing
        ? await updateFood(String(food.id), data)
        : await createFood(data);

      if (result.ok) {
        toast({
          title: isEditing ? "Alimento actualizado" : "Alimento creado",
          description: isEditing
            ? "Los cambios se han guardado correctamente."
            : "El alimento ha sido registrado exitosamente.",
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
            form.setError(field as keyof FoodFormData, {
              type: "server",
              message: errors[0],
            });
          });
        }
      }
    } catch {
      toast({
        title: "Error inesperado",
        description: "Ocurrió un error al guardar el alimento.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  /**
   * Manejar eliminación de alimento
   */
  const handleDelete = async () => {
    if (!food) return;

    setIsDeleting(true);

    try {
      const result = await deleteFood(String(food.id));

      if (result.ok) {
        toast({
          title: "Alimento eliminado",
          description: "El alimento ha sido eliminado correctamente.",
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
        description: "Ocurrió un error al eliminar el alimento.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Sección 1: Información Básica */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Información Básica</h3>
            <p className="text-sm text-muted-foreground">
              Identificación del alimento
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Nombre <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Royal Canin Kitten" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Marca */}
            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl>
                    <Input placeholder="Royal Canin" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tipo de Alimento */}
            <FormField
              control={form.control}
              name="food_type"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>
                    Tipo de Alimento <span className="text-destructive">*</span>
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {FOOD_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.emoji} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {
                      FOOD_TYPE_OPTIONS.find((opt) => opt.value === field.value)
                        ?.description
                    }
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Sección 2: Información Nutricional */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Información Nutricional</h3>
            <p className="text-sm text-muted-foreground">
              Valores por 100 gramos de producto
            </p>
          </div>

          {/* Indicador suma de macros */}
          {totalMacros > 0 && (
            <Alert variant={totalMacros > 100 ? "destructive" : "default"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Suma de macronutrientes: <strong>{totalMacros}%</strong>
                {totalMacros > 100 && " - No puede exceder 100%"}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Calorías */}
            <FormField
              control={form.control}
              name="calories_per_100g"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calorías (kcal/100g)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="350"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? parseInt(e.target.value) : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Proteína */}
            <FormField
              control={form.control}
              name="protein_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proteína (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="30.0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grasa */}
            <FormField
              control={form.control}
              name="fat_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grasa (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="15.0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Carbohidratos */}
            <FormField
              control={form.control}
              name="carbs_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carbohidratos (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="40.0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fibra */}
            <FormField
              control={form.control}
              name="fiber_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fibra (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="3.0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Humedad */}
            <FormField
              control={form.control}
              name="moisture_percentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Humedad (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      placeholder="10.0"
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Sección 3: Detalles del Producto */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Detalles del Producto</h3>
            <p className="text-sm text-muted-foreground">
              Información adicional del producto
            </p>
          </div>

          <div className="space-y-4">
            {/* Ingredientes */}
            <FormField
              control={form.control}
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ingredientes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Pollo deshidratado, arroz, maíz, grasa animal..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Lista de ingredientes en orden de cantidad
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Tamaño porción */}
              <FormField
                control={form.control}
                name="serving_size_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño Porción (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tamaño paquete */}
              <FormField
                control={form.control}
                name="package_size_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tamaño Paquete (g)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="3000"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseInt(e.target.value)
                              : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Precio */}
              <FormField
                control={form.control}
                name="price_per_package"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Precio Paquete ($)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="45.99"
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Sección 4: Calidad */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Calidad</h3>
            <p className="text-sm text-muted-foreground">
              Evaluación de palatabilidad y digestibilidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Palatabilidad */}
            <FormField
              control={form.control}
              name="palatability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Palatabilidad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona calidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUALITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.emoji} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Qué tan bien lo aceptan las mascotas
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Digestibilidad */}
            <FormField
              control={form.control}
              name="digestibility"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Digestibilidad</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona calidad" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {QUALITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.emoji} {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Facilidad de digestión y aprovechamiento
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Separator />

        {/* Sección 5: Restricciones */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Restricciones</h3>
            <p className="text-sm text-muted-foreground">
              Especies y edades para las que es adecuado
            </p>
          </div>

          {/* Especies Aptas */}
          <FormField
            control={form.control}
            name="suitable_for_species"
            render={() => (
              <FormItem>
                <FormLabel>Especies Aptas</FormLabel>
                <FormDescription>
                  Selecciona todas las especies para las que es adecuado
                </FormDescription>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {SPECIES_OPTIONS.map((species) => (
                    <FormField
                      key={species.value}
                      control={form.control}
                      name="suitable_for_species"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={species.value}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(species.value)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        species.value,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== species.value
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              {species.emoji} {species.label}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Rango de Edad */}
          <FormField
            control={form.control}
            name="age_range"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Etapa de Vida</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona etapa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {AGE_RANGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {AGE_RANGE_OPTIONS.find((opt) => opt.value === field.value)
                    ?.description || "Selecciona la etapa de vida adecuada"}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        {/* Botones de Acción */}
        <div className="flex flex-col-reverse sm:flex-row justify-between gap-4">
          <div>
            {isEditing && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={isSubmitting || isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Eliminar alimento?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción eliminará permanentemente el alimento &quot;
                      {food?.name}&quot;. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Eliminar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting || isDeleting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                "Guardar Cambios"
              ) : (
                "Crear Alimento"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
