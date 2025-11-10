"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeedingForm } from "@/components/feeding/FeedingForm";
import { createFeeding } from "../actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

interface NewFeedingClientProps {
  pets: Pet[];
  foods: Food[];
}

export function NewFeedingClient({ pets, foods }: NewFeedingClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pre-fill con fecha y hora actual
  const now = new Date();
  const defaultValues = {
    feeding_date: now.toISOString().split("T")[0], // YYYY-MM-DD
    feeding_time: now.toTimeString().slice(0, 5), // HH:MM
  };

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true);
    const result = await createFeeding(formData);

    if (result.ok) {
      toast.success("Alimentación registrada correctamente");
      router.push("/feeding");
      router.refresh();
    } else {
      toast.error(result.message || "Error al registrar alimentación");
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
        <h1 className="text-3xl font-bold tracking-tight">Registrar alimentación</h1>
        <p className="text-muted-foreground">
          Registra una nueva comida para una mascota
        </p>
      </div>

      {/* Verificar si hay pets y foods */}
      {pets.length === 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>No hay mascotas registradas</CardTitle>
            <CardDescription>
              Debes registrar al menos una mascota antes de registrar alimentaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/pets">Ir a Mascotas</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {foods.length === 0 && pets.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle>No hay alimentos registrados</CardTitle>
            <CardDescription>
              Debes registrar al menos un alimento antes de registrar alimentaciones.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/foods">Ir a Alimentos</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Form */}
      {pets.length > 0 && foods.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva alimentación</CardTitle>
            <CardDescription>
              Completa los datos de la alimentación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FeedingForm
              pets={pets}
              foods={foods}
              mode="create"
              defaultValues={defaultValues}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
