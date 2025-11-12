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
import {
  ConsumptionTrendChart,
  MacronutrientPieChart,
  FeedingHistoryTable,
  MetricCard,
} from "@/components/analytics";
import { BarChart3, Info } from "lucide-react";

// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Analytics - Pet SiKness",
  description: "Análisis y visualización de datos nutricionales",
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
// COMPONENTE: ANALYTICS HEADER
// ============================================

async function AnalyticsHeader() {
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
          <BarChart3 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Analytics y Estadísticas
          </h1>
        </div>
        <p className="text-muted-foreground">
          Visualización completa de datos nutricionales para {totalPets}{" "}
          mascota{totalPets !== 1 ? "s" : ""}
        </p>
      </div>
    );
  } catch (error) {
    return (
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          Analytics y Estadísticas
        </h1>
        <p className="text-muted-foreground">
          Visualización de datos nutricionales
        </p>
      </div>
    );
  }
}

// ============================================
// COMPONENTE: MÉTRICAS GENERALES
// ============================================

async function GeneralMetrics() {
  try {
    const { householdId } = await requireHousehold();

    // Query para métricas del household
    const metricsResult = await query(
      `
      SELECT 
        COUNT(DISTINCT f.pet_id) as active_pets,
        COUNT(f.id) as total_feedings,
        COALESCE(AVG(f.amount_eaten_grams), 0) as avg_consumption,
        COUNT(DISTINCT f.feeding_date) as days_with_data
      FROM feedings f
      JOIN pets p ON f.pet_id = p.id
      WHERE p.household_id = $1
        AND f.feeding_date >= CURRENT_DATE - INTERVAL '30 days'
      `,
      [householdId]
    );

    const metrics = metricsResult.rows[0] as {
      active_pets: string;
      total_feedings: string;
      avg_consumption: string;
      days_with_data: string;
    };

    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Mascotas activas"
          value={metrics.active_pets || "0"}
          description="Con registros últimos 30 días"
        />
        <MetricCard
          title="Total alimentaciones"
          value={metrics.total_feedings || "0"}
          description="Últimos 30 días"
        />
        <MetricCard
          title="Consumo promedio"
          value={`${Number(metrics.avg_consumption || 0).toFixed(0)}g`}
          description="Por alimentación"
        />
        <MetricCard
          title="Días con datos"
          value={metrics.days_with_data || "0"}
          description="De los últimos 30"
        />
      </div>
    );
  } catch {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error cargando métricas generales</AlertDescription>
      </Alert>
    );
  }
}

// ============================================
// COMPONENTE: GRÁFICOS PRINCIPALES
// ============================================

async function MainCharts() {
  try {
    const { householdId } = await requireHousehold();

    const petsResult = await query(
      `SELECT id, name FROM pets WHERE household_id = $1 ORDER BY name LIMIT 1`,
      [householdId]
    );

    const firstPet = petsResult.rows[0] as Pet | undefined;

    return (
      <div className="space-y-6">
        {/* Tendencia de consumo */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Consumo (Últimos 30 días)</CardTitle>
            <CardDescription>
              Evolución diaria de alimentación para todas las mascotas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsumptionTrendChart days={30} height="400px" />
          </CardContent>
        </Card>

        {/* Grid con 2 gráficos */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tendencia 7 días */}
          <Card>
            <CardHeader>
              <CardTitle>Últimos 7 Días</CardTitle>
              <CardDescription>Consumo reciente detallado</CardDescription>
            </CardHeader>
            <CardContent>
              <ConsumptionTrendChart days={7} height="300px" />
            </CardContent>
          </Card>

          {/* Macronutrientes */}
          {firstPet ? (
            <Card>
              <CardHeader>
                <CardTitle>Macronutrientes - {firstPet.name}</CardTitle>
                <CardDescription>
                  Distribución promedio (30 días)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MacronutrientPieChart
                  petId={firstPet.id}
                  days={30}
                  height="300px"
                />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Macronutrientes</CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Registra al menos una mascota para ver análisis de
                    macronutrientes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  } catch {
    return (
      <Alert variant="destructive">
        <AlertDescription>Error cargando gráficos</AlertDescription>
      </Alert>
    );
  }
}

// ============================================
// COMPONENTE: TABLA DE HISTORIAL
// ============================================

function HistorySection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial Completo de Alimentación</CardTitle>
        <CardDescription>
          Todos los registros con filtros y paginación
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FeedingHistoryTable pageSize={20} />
      </CardContent>
    </Card>
  );
}

// ============================================
// COMPONENTE LOADING
// ============================================

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function AnalyticsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <AnalyticsHeader />
      </Suspense>

      {/* Métricas generales */}
      <Suspense fallback={<AnalyticsSkeleton />}>
        <GeneralMetrics />
      </Suspense>

      {/* Gráficos principales */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <MainCharts />
      </Suspense>

      {/* Tabla de historial */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <HistorySection />
      </Suspense>
    </div>
  );
}
