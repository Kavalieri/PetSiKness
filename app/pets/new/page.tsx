"use client";

import { useRouter } from "next/navigation";
import { PetForm } from "@/components/pets/PetForm";

/**
 * Página de creación de nueva mascota
 *
 * Client Component que renderiza PetForm en modo crear (sin prop `pet`).
 * Maneja navegación tras operaciones exitosas o cancelaciones.
 *
 * @route /pets/new
 */
export default function NewPetPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Nueva Mascota</h1>

      <PetForm
        onSuccess={() => router.push("/pets")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
