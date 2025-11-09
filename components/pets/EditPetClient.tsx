"use client";

import { useRouter } from "next/navigation";
import { PetForm } from "@/components/pets/PetForm";
import type { Pet } from "@/types/pets";

/**
 * Client Component para edición de mascotas
 * 
 * Wrapper de PetForm que maneja navegación con useRouter.
 * Recibe mascota pre-cargada del Server Component padre.
 * 
 * @param pet - Mascota a editar (validada en server)
 */
interface EditPetClientProps {
  pet: Pet;
}

export function EditPetClient({ pet }: EditPetClientProps) {
  const router = useRouter();

  return (
    <PetForm
      pet={pet}
      onSuccess={() => router.push("/pets")}
      onCancel={() => router.back()}
    />
  );
}
