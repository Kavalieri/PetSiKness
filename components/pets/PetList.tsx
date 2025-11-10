import Link from "next/link";
import { PawPrint } from "lucide-react";
import { getPets } from "@/app/pets/actions";
import { PetCard } from "./PetCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

// ============================================
// SERVER COMPONENT
// ============================================

export async function PetList() {
  // Fetch mascotas del hogar activo
  const result = await getPets();

  // Manejo de errores
  if (!result.ok) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertTitle>Error al cargar mascotas</AlertTitle>
        <AlertDescription>{result.message}</AlertDescription>
      </Alert>
    );
  }

  const pets = result.data || [];

  // Empty state - sin mascotas
  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="mb-6">
          <PawPrint
            className="h-24 w-24 text-muted-foreground/40"
            strokeWidth={1.5}
          />
        </div>

        <h3 className="text-2xl font-semibold mb-2">
          Aún no tienes mascotas registradas
        </h3>

        <p className="text-muted-foreground mb-6 max-w-md">
          Añade tu primera mascota para comenzar a hacer seguimiento de su
          alimentación y salud.
        </p>

        <Button asChild size="lg">
          <Link href="/pets/new">Añadir primera mascota</Link>
        </Button>
      </div>
    );
  }

  // Grid de mascotas
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {pets.map((pet) => (
        <PetCard key={String(pet.id)} pet={pet} />
      ))}
    </div>
  );
}
