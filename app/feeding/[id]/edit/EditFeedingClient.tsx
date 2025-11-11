"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedingForm } from "@/components/feeding/FeedingForm";
import { updateFeeding } from "../../actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Pet {
  id: string;
  name: string;
  species: string;
}

interface Food {
  id: string;
  name: string;
  brand: string | null;
}

interface FeedingData {
  id: string;
  pet_id: string;
  pet_name: string;
  food_id: string;
  food_name: string;
  feeding_date: string;
  feeding_time: string | null;
  meal_number: number | null;
  amount_served_grams: number;
  amount_eaten_grams: number;
  appetite_rating: string | null;
  eating_speed: string | null;
  vomited: boolean | null;
  had_diarrhea: boolean | null;
  had_stool: boolean | null;
  stool_quality: string | null;
  notes: string | null;
}

interface EditFeedingClientProps {
  feeding: FeedingData;
  pets: Pet[];
  foods: Food[];
}

export function EditFeedingClient({
  feeding,
  pets,
  foods,
}: EditFeedingClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);

    // Añadir el ID al FormData
    formData.append("id", feeding.id);

    const result = await updateFeeding(formData);

    if (result.ok) {
      toast.success("Alimentación actualizada correctamente");
      router.push("/feeding");
      router.refresh();
    } else {
      toast.error(result.message || "Error al actualizar alimentación");
      if (result.fieldErrors) {
        Object.entries(result.fieldErrors).forEach(([field, errors]) => {
          errors.forEach((error) => {
            toast.error(`${field}: ${error}`);
          });
        });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/feeding">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al historial
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          Editar alimentación
        </h1>
        <p className="text-muted-foreground">
          Modifica los datos de la alimentación de {feeding.pet_name}
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle>Editar alimentación</CardTitle>
          <CardDescription>Actualiza los datos del registro</CardDescription>
        </CardHeader>
        <CardContent>
          <FeedingForm
            pets={pets}
            foods={foods}
            mode="edit"
            defaultValues={{
              pet_id: feeding.pet_id,
              food_id: feeding.food_id,
              feeding_date: feeding.feeding_date,
              feeding_time: feeding.feeding_time || undefined,
              // meal_number se calcula automáticamente en el backend
              amount_served_grams: feeding.amount_served_grams,
              amount_eaten_grams: feeding.amount_eaten_grams,
              appetite_rating:
                (feeding.appetite_rating as
                  | "refused"
                  | "poor"
                  | "normal"
                  | "good"
                  | "excellent") || undefined,
              eating_speed:
                (feeding.eating_speed as
                  | "very_slow"
                  | "slow"
                  | "normal"
                  | "fast"
                  | "very_fast") || undefined,
              vomited: feeding.vomited || false,
              had_diarrhea: feeding.had_diarrhea || false,
              had_stool: feeding.had_stool || false,
              stool_quality:
                (feeding.stool_quality as
                  | "liquid"
                  | "soft"
                  | "normal"
                  | "hard") || undefined,
              notes: feeding.notes || undefined,
            }}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
