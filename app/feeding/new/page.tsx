import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { NewFeedingClient } from "./NewFeedingClient";
import { notFound } from "next/navigation";

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Nuevo registro - Pet SiKness",
  description: "Registrar nueva alimentación",
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function NewFeedingPage() {
  try {
    // Auth
    const { householdId } = await requireHousehold();

    // Obtener mascotas y alimentos
    const petsQuery = await query(
      `SELECT id, name, species FROM pets WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    const foodsQuery = await query(
      `SELECT id, name, brand FROM foods WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    return <NewFeedingClient pets={petsQuery.rows} foods={foodsQuery.rows} />;
  } catch (error) {
    console.error("Error en página de nuevo feeding:", error);
    notFound();
  }
}
