import Link from "next/link";
import { requireHousehold } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { PetList } from "@/components/pets/PetList";

/**
 * Página principal de listado de mascotas
 *
 * Muestra todas las mascotas del hogar actual con opción de añadir nueva.
 * Requiere autenticación y membresía en un hogar.
 *
 * @route /pets
 */
export default async function PetsPage() {
  // Verificar autenticación y pertenencia a hogar
  await requireHousehold();

  return (
    <div className="container mx-auto p-4 sm:py-6 sm:px-4">
      {/* Header con título y botón de acción */}
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">Mis Mascotas</h1>
        <Link href="/pets/new">
          <Button className="w-full sm:w-auto">+ Añadir Mascota</Button>
        </Link>
      </div>

      {/* Lista de mascotas del hogar */}
      <PetList />
    </div>
  );
}
