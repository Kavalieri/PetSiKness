import { Suspense } from "react";
import { requireHousehold } from "@/lib/auth";
import { query } from "@/lib/db";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecommendationsPanel } from "@/components/recommendations";
import { Sparkles, Info } from "lucide-react";

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Recomendaciones - Pet SiKness",
  description: "Recomendaciones nutricionales personalizadas para tus mascotas",
};

// ============================================
// TYPES
// ============================================

interface Pet {
  id: string;
  name: string;
  species: string;
}

// ============================================
// COMPONENTE: HEADER
// ============================================

async function RecommendationsHeader() {
  try {
    const { householdId } = await requireHousehold();

    const petsResult = await query(
      `SELECT id, name, species FROM pets WHERE household_id = $1 ORDER BY name`,
      [householdId]
    );

    const pets = petsResult.rows as Pet[];
    const totalPets = pets.length;

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Recomendaciones Nutricionales
          </h1>
        </div>
        <p className="text-muted-foreground">
          Sugerencias personalizadas basadas en patrones de alimentación para{" "}
          {totalPets} mascota{totalPets !== 1 ? "s" : ""}
        </p>
      </div>
    );
  } catch {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Recomendaciones Nutricionales
          </h1>
        </div>
        <p className="text-muted-foreground">
          Sugerencias personalizadas basadas en patrones de alimentación
        </p>
      </div>
    );
  }
}

// ============================================
// COMPONENTE: INFO PANEL
// ============================================

function InfoPanel() {
  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Las recomendaciones se generan analizando los últimos 30 días de
        alimentación. Incluyen alertas nutricionales, problemas detectados y
        sugerencias de mejora adaptadas a cada mascota.
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// COMPONENTE: RECOMMENDATIONS SECTION
// ============================================

async function RecommendationsSection() {
  try {
    const { householdId } = await requireHousehold();

    // Verificar que hay mascotas
    const petsResult = await query(
      `SELECT COUNT(id) as count FROM pets WHERE household_id = $1`,
      [householdId]
    );

    const petCount = (petsResult.rows[0] as { count: string }).count;

    if (Number(petCount) === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Sin mascotas registradas</CardTitle>
            <CardDescription>
              Registra al menos una mascota para ver recomendaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Las recomendaciones nutricionales requieren tener mascotas
                registradas en el sistema. Dirígete a la sección de Mascotas
                para crear tu primer perfil.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    // Verificar que hay datos de alimentación
    const feedingsResult = await query(
      `
      SELECT COUNT(f.id) as count 
      FROM feedings f
      JOIN pets p ON f.pet_id = p.id
      WHERE p.household_id = $1
        AND f.feeding_date >= CURRENT_DATE - INTERVAL '30 days'
      `,
      [householdId]
    );

    const feedingCount = (feedingsResult.rows[0] as { count: string }).count;

    if (Number(feedingCount) === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Sin datos de alimentación</CardTitle>
            <CardDescription>
              Registra alimentaciones para obtener recomendaciones
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Las recomendaciones se basan en el análisis de patrones de
                alimentación. Registra las comidas de tus mascotas durante
                algunos días para recibir sugerencias personalizadas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      );
    }

    // Mostrar panel de recomendaciones
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Panel de Recomendaciones</CardTitle>
            <CardDescription>
              Análisis de {feedingCount} registros en los últimos 30 días
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RecommendationsPanel />
          </CardContent>
        </Card>
      </div>
    );
  } catch {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Error cargando recomendaciones. Intenta de nuevo más tarde.
        </AlertDescription>
      </Alert>
    );
  }
}

// ============================================
// COMPONENTE LOADING
// ============================================

function RecommendationsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function RecommendationsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <RecommendationsHeader />
      </Suspense>

      {/* Info panel */}
      <InfoPanel />

      {/* Recommendations */}
      <Suspense fallback={<RecommendationsSkeleton />}>
        <RecommendationsSection />
      </Suspense>
    </div>
  );
}
