import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/auth";
import { getPetById } from "@/app/pets/actions";
import { EditPetClient } from "@/components/pets/EditPetClient";

/**
 * Página de edición de mascota
 *
 * Server Component que:
 * - Valida autenticación y household
 * - Fetch mascota por ID con validación de pertenencia
 * - Retorna 404 si no existe o no pertenece al household
 * - Pasa mascota pre-cargada a Client Component
 *
 * @route /pets/[id]/edit
 */
export default async function EditPetPage({
  params,
}: {
  params: { id: string };
}) {
  // Verificar autenticación y pertenencia a hogar
  await requireHousehold();

  // Fetch mascota con validación automática de household
  const result = await getPetById(params.id);

  // 404 si no existe o no pertenece al household del usuario
  if (!result.ok || !result.data) {
    notFound();
  }

  return (
    <div className="container mx-auto py-6 px-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Editar Mascota</h1>
      <EditPetClient pet={result.data} />
    </div>
  );
}
