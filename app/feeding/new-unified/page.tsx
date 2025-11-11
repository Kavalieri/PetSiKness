import { requireHousehold } from "@/lib/auth";
import { query } from "@/lib/db";
import { UnifiedFeedingForm } from "./UnifiedFeedingForm";
import { notFound } from "next/navigation";

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Registrar Alimentación - Pet SiKness",
  description: "Registrar alimentación para una o varias mascotas",
};

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function NewUnifiedFeedingPage() {
  try {
    const { householdId } = await requireHousehold();

    // Obtener mascotas activas con información completa
    const petsResult = await query(
      `SELECT 
        id, 
        name, 
        species, 
        breed,
        daily_food_goal_grams,
        daily_meals_target
      FROM pets 
      WHERE household_id = $1 AND is_active = true 
      ORDER BY name`,
      [householdId]
    );

    if (petsResult.rows.length === 0) {
      return (
        <div className="container mx-auto p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">Sin mascotas activas</h2>
            <p className="text-muted-foreground">
              Necesitas al menos una mascota activa para registrar alimentación.
            </p>
          </div>
        </div>
      );
    }

    // Obtener alimentos
    const foodsResult = await query(
      `SELECT id, name, brand FROM foods WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    return (
      <div className="container mx-auto p-6">
        <UnifiedFeedingForm pets={petsResult.rows} foods={foodsResult.rows} />
      </div>
    );
  } catch (error) {
    console.error("Error en página unified feeding:", error);
    notFound();
  }
}
