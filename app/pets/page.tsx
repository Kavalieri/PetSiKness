import Link from 'next/link';
import { requireHousehold } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { PetList } from '@/components/pets/PetList';

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
    <div className="container mx-auto py-6 px-4">
      {/* Header con título y botón de acción */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Mis Mascotas</h1>
        <Link href="/pets/new">
          <Button>+ Añadir Mascota</Button>
        </Link>
      </div>

      {/* Lista de mascotas del hogar */}
      <PetList />
    </div>
  );
}
