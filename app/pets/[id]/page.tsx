import { notFound } from "next/navigation";
import { requireHousehold } from "@/lib/auth";
import { getPetById } from "@/app/pets/actions";
import { PetDetailView } from "@/components/pets/PetDetailView";

/**
 * Página de detalle de mascota
 *
 * Server Component que:
 * - Valida autenticación y household
 * - Fetch mascota por ID con validación de pertenencia
 * - Retorna 404 si no existe o no pertenece al household
 * - Muestra vista completa con PetDetailView
 *
 * @route /pets/[id]
 */
export default async function PetDetailPage({
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
    <div className="container mx-auto py-6 px-4">
      <PetDetailView pet={result.data} />
    </div>
  );
}
