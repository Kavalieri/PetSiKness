import { Suspense } from "react";
import { format, isToday as isTodayFn } from "date-fns";
import { es } from "date-fns/locale";
import { query } from "@/lib/db";
import { requireHousehold } from "@/lib/auth";
import {
  getTodayBalance,
  getAlertsCount,
  getHouseholdOverview,
  type TodayBalance,
} from "./actions";
import type { MealBalance } from "@/lib/utils/meal-balance";
import { DailyBalanceList } from "@/components/feeding/DailyBalanceCard";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  UtensilsCrossed,
  AlertTriangle,
  PawPrint,
  Target,
  Clock,
  Info,
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";
import { RecommendationsPanel } from "@/components/recommendations";
import {
  ConsumptionTrendChart,
  MacronutrientPieChart,
  FeedingHistoryTable,
} from "@/components/analytics";
// ============================================
// METADATA
// ============================================

export const metadata = {
  title: "Dashboard - Pet SiKness",
  description: "Panel de control de alimentación de mascotas",
};

// ============================================
// COMPONENTE STATS CARDS
// ============================================

async function StatsCards({ date }: { date: string }) {
  const [overviewResult, alertsCountResult] = await Promise.all([
    getHouseholdOverview(date),
    getAlertsCount(date),
  ]);

  // Manejar errores
  if (!overviewResult.ok || !alertsCountResult.ok) {
    return <div className="text-destructive">Error cargando estadísticas</div>;
  }

  const overview = overviewResult.data!;
  const alertsCount = alertsCountResult.data!;

  // Determinar si es fecha actual
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = format(dateObj, "d 'de' MMM", { locale: es });

  const stats = [
    {
      title: "Mascotas totales",
      value: overview.total_pets,
      icon: PawPrint,
      description: "En tu hogar",
    },
    {
      title: "Cumpliendo meta",
      value: overview.pets_on_track_today,
      icon: Target,
      description: isToday ? "Hoy" : formattedDate,
      color: "text-green-600",
    },
    {
      title: "Alertas",
      value: alertsCount,
      icon: AlertTriangle,
      description: isToday
        ? "Necesitan atención"
        : `Alertas del ${formattedDate}`,
      color: alertsCount > 0 ? "text-destructive" : "text-green-600",
    },
    {
      title: "Ayer cumplido",
      value: `${Number(overview.yesterday_achievement_pct || 0).toFixed(0)}%`,
      icon: TrendingUp,
      description: isToday
        ? "Día anterior completo"
        : `Día previo a ${formattedDate}`,
      color:
        Number(overview.yesterday_achievement_pct || 0) >= 90
          ? "text-green-600"
          : Number(overview.yesterday_achievement_pct || 0) >= 70
          ? "text-yellow-600"
          : "text-red-600",
    },
  ];

  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Icon
                className={`h-4 w-4 ${stat.color || "text-muted-foreground"}`}
              />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stat.color || ""}`}>
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ============================================
// ============================================
// COMPONENTE ALERTAS CRÍTICAS
// ============================================

/**
 * Determina si una mascota necesita atención basándose en el estado de sus tomas
 * Lógica inteligente:
 * - Si tiene tomas PENDING (futuras): NO alertar (progreso normal)
 * - Si tiene tomas DELAYED: Alerta crítica
 * - Si todas completadas pero total insuficiente: Alerta
 */
function needsAttention(balance: TodayBalance): {
  needs: boolean;
  reason?: string;
} {
  // Si no tiene meal_balances, usar lógica legacy
  if (!balance.meal_balances || balance.meal_balances.length === 0) {
    return {
      needs: balance.status === "under",
      reason: balance.status === "under" ? "Objetivo no alcanzado" : undefined,
    };
  }

  const meals = balance.meal_balances;
  const hasPending = meals.some((m: MealBalance) => m.status === "pending");
  const hasDelayed = meals.some((m: MealBalance) => m.status === "delayed");
  const allCompleted = meals.every(
    (m: MealBalance) => m.status === "completed"
  );

  // Si hay tomas DELAYED: Alerta crítica
  if (hasDelayed) {
    const delayedCount = meals.filter(
      (m: MealBalance) => m.status === "delayed"
    ).length;
    return {
      needs: true,
      reason: `${delayedCount} toma${delayedCount > 1 ? "s" : ""} retrasada${
        delayedCount > 1 ? "s" : ""
      }`,
    };
  }

  // Si hay tomas PENDING (futuras): NO alertar
  if (hasPending) {
    return { needs: false };
  }

  // Si todas completadas pero total insuficiente: Alerta
  if (allCompleted && balance.status === "under") {
    return {
      needs: true,
      reason: "Total diario insuficiente",
    };
  }

  return { needs: false };
}

async function CriticalAlerts({ date }: { date: string }) {
  const balancesResult = await getTodayBalance(date);

  if (!balancesResult.ok) {
    return null;
  }

  const balances = balancesResult.data!;

  // ✨ Nueva lógica: filtrar mascotas que realmente necesitan atención
  const petsNeedingAttention = balances
    .map((b) => ({ balance: b, alert: needsAttention(b) }))
    .filter((item) => item.alert.needs);

  if (petsNeedingAttention.length === 0) {
    return null;
  }

  // Determinar si es fecha actual
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;
  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = format(dateObj, "d 'de' MMMM", { locale: es });

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>
        {isToday
          ? "¡Atención necesaria!"
          : `Alerta histórica (${formattedDate})`}
      </AlertTitle>
      <AlertDescription>
        {petsNeedingAttention.length === 1 ? (
          <>
            <strong>{petsNeedingAttention[0].balance.pet_name}</strong>{" "}
            {petsNeedingAttention[0].alert.reason || "necesita atención"}.
          </>
        ) : (
          <>
            <strong>{petsNeedingAttention.length} mascotas</strong> necesitan
            atención:{" "}
            {petsNeedingAttention
              .map((item) => `${item.balance.pet_name} (${item.alert.reason})`)
              .join(", ")}
            .
          </>
        )}
      </AlertDescription>
    </Alert>
  );
}

// ============================================
// COMPONENTE BALANCE DIARIO
// ============================================

async function TodayBalances({ date }: { date: string }) {
  const balancesResult = await getTodayBalance(date);

  if (!balancesResult.ok) {
    return (
      <div className="text-destructive">Error cargando balance del día</div>
    );
  }

  const balances = balancesResult.data!;

  // Determinar si es hoy para el título
  const dateObj = new Date(date + "T00:00:00");
  const isToday = isTodayFn(dateObj);

  const title = isToday
    ? "Balance del día"
    : `Balance del ${format(dateObj, "d 'de' MMMM", { locale: es })}`;
  const subtitle = isToday
    ? "Progreso de alimentación de hoy"
    : `Datos históricos del ${format(dateObj, "EEEE d 'de' MMMM 'de' yyyy", {
        locale: es,
      })}`;

  return (
    <section>
      <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild size="default" className="w-full sm:w-auto">
          <Link href="/feeding/new-unified">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Registrar comida
          </Link>
        </Button>
      </div>
      <DailyBalanceList balances={balances} />
    </section>
  );
}

// ============================================
// COMPONENTE ANALYTICS CHARTS
// ============================================

/**
 * Sección de Analytics con gráficos y tablas
 * Muestra:
 * - Tendencia de consumo (todas las mascotas del household)
 * - Distribución macronutrientes (requiere petId - se muestra para primera mascota)
 * - Historial reciente (todas las mascotas)
 */
async function AnalyticsSection() {
  // Obtener primera mascota del household para MacronutrientPieChart
  // (requiere petId específico)
  try {
    const { householdId } = await requireHousehold();

    const petsResult = await query(
      `SELECT id, name FROM pets WHERE household_id = $1 ORDER BY name LIMIT 1`,
      [householdId]
    );

    const firstPet = petsResult.rows[0] as
      | { id: string; name: string }
      | undefined;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">Análisis y Tendencias</h2>
        <p className="text-sm text-muted-foreground">
          Visualización de datos nutricionales e historial
        </p>
      </div>

      {/* Gráficos en grid 2 columnas */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendencia de Consumo</CardTitle>
            <CardDescription>
              Evolución diaria de alimentación (últimos 7 días)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ConsumptionTrendChart days={7} />
          </CardContent>
        </Card>

        {firstPet ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Macronutrientes - {firstPet.name}
              </CardTitle>
              <CardDescription>
                Composición promedio (últimos 30 días)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MacronutrientPieChart petId={firstPet.id} days={30} />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Distribución de Macronutrientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Registra al menos una mascota para ver análisis detallado.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabla de historial full width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial Reciente</CardTitle>
          <CardDescription>
            Últimas alimentaciones registradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FeedingHistoryTable pageSize={10} />
        </CardContent>
      </Card>
    </section>
  );
  } catch (error) {
    // Si falla autenticación, retornar null (no debería suceder en esta ruta)
    return null;
  }
}

// ============================================
// COMPONENTE RECOMMENDATIONS
// ============================================

function RecommendationsSection() {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold">
          Recomendaciones Nutricionales
        </h2>
        <p className="text-sm text-muted-foreground">
          Sugerencias personalizadas basadas en análisis del historial
        </p>
      </div>
      <RecommendationsPanel />
    </section>
  );
}

// ============================================
// COMPONENTE ACCIONES RÁPIDAS
// ============================================

function QuickActions() {
  const actions = [
    {
      title: "Ver historial",
      description: "Consulta todos los registros",
      href: "/feeding",
      icon: Clock,
    },
    {
      title: "Registrar comida",
      description: "Nueva alimentación",
      href: "/feeding/new-unified",
      icon: UtensilsCrossed,
      variant: "default" as const,
    },
    {
      title: "Gestionar mascotas",
      description: "Ver y editar perfiles",
      href: "/pets",
      icon: PawPrint,
    },
  ];

  return (
    <section>
      <h2 className="text-xl sm:text-2xl font-bold mb-4">Acciones rápidas</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow cursor-pointer"
            >
              <Link href={action.href}>
                <CardHeader>
                  <Icon className="h-8 w-8 mb-2" />
                  <CardTitle>{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Link>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// ============================================
// COMPONENTE LOADING
// ============================================

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL
// ============================================

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  // Obtener fecha de URL o usar HOY
  const date = searchParams.date || new Date().toISOString().split("T")[0];

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header con navegación temporal (Client Component) */}
      <DashboardHeader />

      {/* Stats Cards */}
      <Suspense fallback={<DashboardSkeleton />}>
        <StatsCards date={date} />
      </Suspense>

      {/* Alertas críticas */}
      <Suspense fallback={null}>
        <CriticalAlerts date={date} />
      </Suspense>

      {/* Balance del día */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <TodayBalances date={date} />
      </Suspense>

      {/* Acciones rápidas */}
      <QuickActions />

      {/* Analytics y Tendencias */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <AnalyticsSection />
      </Suspense>

      {/* Recomendaciones Nutricionales */}
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <RecommendationsSection />
      </Suspense>
    </div>
  );
}
