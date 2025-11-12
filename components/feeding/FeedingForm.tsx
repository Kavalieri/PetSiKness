"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

// ============================================
// SCHEMA DE VALIDACIÓN
// ============================================

const feedingFormSchema = z
  .object({
    pet_id: z.string().uuid("Selecciona una mascota"),
    food_id: z.string().uuid("Selecciona un alimento"),
    feeding_date: z.string().min(1, "Fecha requerida"),
    feeding_time: z.string().optional(),
    // portion_number se calcula automáticamente en el backend
    amount_served_grams: z.coerce
      .number()
      .int()
      .positive("Cantidad servida debe ser mayor a 0"),
    amount_eaten_grams: z.coerce
      .number()
      .int()
      .min(0, "Cantidad comida no puede ser negativa"),
    appetite_rating: z
      .enum(["refused", "poor", "normal", "good", "excellent"])
      .optional(),
    eating_speed: z
      .enum(["very_slow", "slow", "normal", "fast", "very_fast"])
      .optional(),
    vomited: z.boolean(),
    had_diarrhea: z.boolean(),
    had_stool: z.boolean(),
    stool_quality: z.enum(["liquid", "soft", "normal", "hard"]).optional(),
    notes: z.string().optional(),
  })
  .refine((data) => data.amount_eaten_grams <= data.amount_served_grams, {
    message: "La cantidad comida no puede ser mayor a la cantidad servida",
    path: ["amount_eaten_grams"],
  });

type FeedingFormData = z.infer<typeof feedingFormSchema>;

// ============================================
// TIPOS
// ============================================

interface Pet {
  id: string;
  name: string;
}

interface Food {
  id: string;
  name: string;
  brand?: string | null;
}

interface FeedingFormProps {
  pets: Pet[];
  foods: Food[];
  mode: "create" | "edit";
  defaultValues?: Partial<FeedingFormData>;
  onSubmit: (formData: FormData) => Promise<void>;
  isSubmitting: boolean;
}

// ============================================
// COMPONENTE
// ============================================

export function FeedingForm({
  pets,
  foods,
  mode,
  defaultValues,
  onSubmit,
  isSubmitting,
}: FeedingFormProps) {
  const [leftoverGrams, setLeftoverGrams] = useState<number>(0);

  // Default values para modo create
  const defaultDate =
    mode === "create" ? new Date().toISOString().split("T")[0] : "";
  const defaultTime =
    mode === "create" ? new Date().toTimeString().slice(0, 5) : "";

  const form = useForm<FeedingFormData>({
    resolver: zodResolver(feedingFormSchema),
    defaultValues: {
      pet_id: defaultValues?.pet_id || "",
      food_id: defaultValues?.food_id || "",
      feeding_date: defaultValues?.feeding_date || defaultDate,
      feeding_time: defaultValues?.feeding_time || defaultTime,
      // portion_number se calcula automáticamente en el backend
      amount_served_grams: defaultValues?.amount_served_grams || 0,
      amount_eaten_grams: defaultValues?.amount_eaten_grams || 0,
      appetite_rating: defaultValues?.appetite_rating,
      eating_speed: defaultValues?.eating_speed,
      vomited: defaultValues?.vomited || false,
      had_diarrhea: defaultValues?.had_diarrhea || false,
      had_stool: defaultValues?.had_stool || false,
      stool_quality: defaultValues?.stool_quality,
      notes: defaultValues?.notes,
    },
  });

  const watchedServed = form.watch("amount_served_grams");
  const watchedEaten = form.watch("amount_eaten_grams");
  const watchedHadStool = form.watch("had_stool");

  // Resetear formulario cuando cambian los defaultValues (para modo edit)
  useEffect(() => {
    if (mode === "edit" && defaultValues) {
      form.reset({
        pet_id: defaultValues.pet_id || "",
        food_id: defaultValues.food_id || "",
        feeding_date: defaultValues.feeding_date || "",
        feeding_time: defaultValues.feeding_time || "",
        amount_served_grams: defaultValues.amount_served_grams || 0,
        amount_eaten_grams: defaultValues.amount_eaten_grams || 0,
        appetite_rating: defaultValues.appetite_rating,
        eating_speed: defaultValues.eating_speed,
        vomited: defaultValues.vomited || false,
        had_diarrhea: defaultValues.had_diarrhea || false,
        had_stool: defaultValues.had_stool || false,
        stool_quality: defaultValues.stool_quality,
        notes: defaultValues.notes,
      });
    }
  }, [mode, defaultValues, form]);

  // Calcular leftover en tiempo real
  useEffect(() => {
    const served = Number(watchedServed) || 0;
    const eaten = Number(watchedEaten) || 0;
    setLeftoverGrams(Math.max(0, served - eaten));
  }, [watchedServed, watchedEaten]);

  const handleFormSubmit = (data: FeedingFormData) => {
    const formData = new FormData();

    // Añadir todos los campos
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.append(key, String(value));
      }
    });

    onSubmit(formData);
  };

  const isValidLeftover = watchedEaten <= watchedServed;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-6"
      >
        {/* Sección 1: Información Básica */}
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mascota */}
              <FormField
                control={form.control}
                name="pet_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mascota *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={mode === "edit" || isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una mascota" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {pets.map((pet) => (
                          <SelectItem key={pet.id} value={pet.id}>
                            {pet.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Alimento */}
              <FormField
                control={form.control}
                name="food_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alimento *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un alimento" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {foods.map((food) => (
                          <SelectItem key={food.id} value={food.id}>
                            {food.name} {food.brand && `- ${food.brand}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha */}
              <FormField
                control={form.control}
                name="feeding_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hora */}
              <FormField
                control={form.control}
                name="feeding_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} disabled={isSubmitting} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Número de comida se calcula automáticamente */}
            </div>
          </CardContent>
        </Card>

        {/* Sección 2: Cantidades */}
        <Card>
          <CardHeader>
            <CardTitle>Cantidades (gramos)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Cantidad servida */}
              <FormField
                control={form.control}
                name="amount_served_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servido *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>
                      Cantidad servida en el plato
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Cantidad comida */}
              <FormField
                control={form.control}
                name="amount_eaten_grams"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comido *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormDescription>Cantidad realmente comida</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Leftover calculado */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  Sobra (calculado)
                </label>
                <div
                  className={`flex flex-col gap-1 p-3 rounded-md border ${
                    isValidLeftover
                      ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isValidLeftover ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    )}
                    <span className="text-2xl font-bold">{leftoverGrams}g</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Servido ({watchedServed}g) - Comido ({watchedEaten}g) =
                    Sobra
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sección 3: Comportamiento y Salud */}
        <Card>
          <CardHeader>
            <CardTitle>Comportamiento y Salud</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Apetito */}
              <FormField
                control={form.control}
                name="appetite_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apetito</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el apetito" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="refused">Rehusó comer</SelectItem>
                        <SelectItem value="poor">Pobre</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="good">Bueno</SelectItem>
                        <SelectItem value="excellent">Excelente</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Velocidad */}
              <FormField
                control={form.control}
                name="eating_speed"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Velocidad al comer</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona la velocidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="very_slow">Muy lento</SelectItem>
                        <SelectItem value="slow">Lento</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="fast">Rápido</SelectItem>
                        <SelectItem value="very_fast">Muy rápido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Checkboxes de salud */}
            <div className="space-y-3 border-t pt-4">
              <FormField
                control={form.control}
                name="vomited"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Vomitó después de comer</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="had_diarrhea"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Tuvo diarrea</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="had_stool"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Hizo deposición</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Calidad de heces (solo si had_stool es true) */}
              {watchedHadStool && (
                <FormField
                  control={form.control}
                  name="stool_quality"
                  render={({ field }) => (
                    <FormItem className="ml-6">
                      <FormLabel>Calidad de las heces</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona la calidad" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="liquid">Líquida</SelectItem>
                          <SelectItem value="soft">Blanda</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="hard">Dura</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Notas */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas adicionales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observaciones sobre la alimentación..."
                      rows={3}
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isSubmitting || !isValidLeftover}
            size="lg"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "create" ? "Registrar alimentación" : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
