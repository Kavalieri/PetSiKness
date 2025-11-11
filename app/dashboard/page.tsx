import { Suspense } from "react";
import {
  getTodayBalance,
  getAlertsCount,
  getHouseholdOverview,
} from "./actions";
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
} from "lucide-react";
import Link from "next/link";
import { DashboardHeader } from "./DashboardHeader";

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
      description: "Hoy",
      color: "text-green-600",
    },
    {
      title: "Alertas",
      value: alertsCount,
      icon: AlertTriangle,
      description: "Necesitan atención",
      color: alertsCount > 0 ? "text-destructive" : "text-green-600",
    },
    {
      title: "Promedio semanal",
      value: `${overview.avg_achievement_pct.toFixed(0)}%`,
      icon: TrendingUp,
      description: "Últimos 7 días",
      color:
        overview.avg_achievement_pct >= 90
          ? "text-green-600"
          : "text-yellow-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
// COMPONENTE ALERTAS CRÍTICAS
// ============================================

async function CriticalAlerts({ date }: { date: string }) {
  const balancesResult = await getTodayBalance(date);

  if (!balancesResult.ok) {
    return null;
  }

  const balances = balancesResult.data!;
  const underTargetPets = balances.filter((b) => b.status === "under");

  if (underTargetPets.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>¡Atención necesaria!</AlertTitle>
      <AlertDescription>
        {underTargetPets.length === 1 ? (
          <>
            <strong>{underTargetPets[0].pet_name}</strong> no ha alcanzado su
            objetivo diario de alimentación.
          </>
        ) : (
          <>
            <strong>{underTargetPets.length} mascotas</strong> no han alcanzado
            su objetivo diario:{" "}
            {underTargetPets.map((p) => p.pet_name).join(", ")}.
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
  const today = new Date().toISOString().split("T")[0];
  const isToday = date === today;

  const title = isToday ? "Balance del día" : `Balance del ${date}`;
  const subtitle = isToday
    ? "Progreso de alimentación de hoy"
    : "Progreso de alimentación histórico";

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">{title}</h2>
          <p className="text-muted-foreground">{subtitle}</p>
        </div>
        <Button asChild>
          <Link href="/feeding/new">
            <UtensilsCrossed className="h-4 w-4 mr-2" />
            Registrar comida
          </Link>
        </Button>
      </div>
      <DailyBalanceList balances={balances} compact />
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
      href: "/feeding/new",
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
      <h2 className="text-2xl font-bold mb-4">Acciones rápidas</h2>
      <div className="grid gap-4 md:grid-cols-3">
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
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="container mx-auto p-6 space-y-6">
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
    </div>
  );
}
