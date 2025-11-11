import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { getFeedingById } from "../../actions";
import { EditFeedingClient } from "./EditFeedingClient";
import { notFound } from "next/navigation";

// ============================================
// METADATA
// ============================================

export async function generateMetadata() {
  return {
    title: `Editar registro - Pet SiKness`,
    description: "Editar registro de alimentación",
  };
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function EditFeedingPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    // Auth
    const { householdId } = await requireHousehold();

    // Obtener feeding
    const feedingResult = await getFeedingById(params.id);
    if (!feedingResult.ok) {
      notFound();
    }

    const feeding = feedingResult.data!;

    // Verificar ownership
    if (feeding.household_id !== householdId) {
      notFound();
    }

    // Obtener mascotas activas y alimentos
    const petsQuery = await query(
      `SELECT id, name, species FROM pets WHERE household_id = $1 AND is_active = true ORDER BY name`,
      [householdId]
    );

    const foodsQuery = await query(
      `SELECT id, name, brand FROM foods WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    return (
      <EditFeedingClient
        feeding={feeding}
        pets={petsQuery.rows}
        foods={foodsQuery.rows}
      />
    );
  } catch (error) {
    console.error("Error en página de edición:", error);
    notFound();
  }
}
