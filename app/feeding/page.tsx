import { getFeedings } from "./actions";
import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { FeedingPageClient } from "./FeedingPageClient";
import { notFound } from "next/navigation";

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Alimentación - Pet SiKness",
  description: "Historial de alimentación de mascotas",
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function FeedingPage({
  searchParams,
}: {
  searchParams: { petId?: string; foodId?: string; startDate?: string; endDate?: string };
}) {
  try {
    // Auth
    const { householdId } = await requireHousehold();

    // Obtener feedings con filtros
    const feedingsResult = await getFeedings({
      petId: searchParams.petId,
      foodId: searchParams.foodId,
      startDate: searchParams.startDate,
      endDate: searchParams.endDate,
      limit: 100,
    });

    if (!feedingsResult.ok) {
      throw new Error(feedingsResult.message);
    }

    // Obtener mascotas y alimentos para los filtros
    const petsQuery = await query(
      `SELECT id, name FROM pets WHERE household_id = $1 AND is_active = true ORDER BY name`,
      [householdId]
    );

    const foodsQuery = await query(
      `SELECT id, name, brand FROM foods WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    return (
      <FeedingPageClient
        feedings={feedingsResult.data!}
        pets={petsQuery.rows}
        foods={foodsQuery.rows}
        initialStartDate={searchParams.startDate}
        initialEndDate={searchParams.endDate}
      />
    );
  } catch (error) {
    console.error("Error en página de feeding:", error);
    notFound();
  }
}
