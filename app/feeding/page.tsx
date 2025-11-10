import { getFeedings } from "./actions";
import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import { FeedingClient } from "./FeedingClient";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
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
  searchParams: { petId?: string; foodId?: string; date?: string };
}) {
  try {
    // Auth
    const { householdId } = await requireHousehold();

    // Obtener feedings con filtros
    const feedingsResult = await getFeedings({
      petId: searchParams.petId,
      foodId: searchParams.foodId,
      startDate: searchParams.date,
      limit: 100,
    });

    if (!feedingsResult.ok) {
      throw new Error(feedingsResult.message);
    }

    // Obtener mascotas y alimentos para los filtros
    const petsQuery = await query(
      `SELECT id, name FROM pets WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    const foodsQuery = await query(
      `SELECT id, name, brand FROM foods WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alimentación</h1>
            <p className="text-muted-foreground">
              Historial de registros de alimentación
            </p>
          </div>
          <Button asChild>
            <Link href="/feeding/new">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo registro
            </Link>
          </Button>
        </div>

        {/* Client Component with list */}
        <FeedingClient
          feedings={feedingsResult.data!}
          pets={petsQuery.rows}
          foods={foodsQuery.rows}
        />
      </div>
    );
  } catch (error) {
    console.error("Error en página de feeding:", error);
    notFound();
  }
}
