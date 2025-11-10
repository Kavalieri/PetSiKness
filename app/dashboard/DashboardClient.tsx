"use client";

import { useState, Suspense } from "react";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { TemporalNavigator } from "@/components/shared/TemporalNavigator";
import { Home } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader } from "@/components/ui/card";

// ============================================
// 🎯 FILOSOFÍA: GESTIÓN DIARIA PRIORITARIA
// ============================================
//
// Este componente implementa la navegación temporal en Dashboard
// manteniendo el foco en la gestión del DÍA ACTUAL.
//
// COMPORTAMIENTO:
//   1. Estado inicial: HOY (gestión diaria sin fricción)
//   2. TemporalNavigator permite análisis retrospectivo opcional
//   3. Fecha seleccionada se propaga a todos los componentes
//   4. Título dinámico refleja el contexto temporal
//
// ============================================

interface DashboardClientProps {
  statsCards: (date: string) => Promise<React.ReactElement>;
  criticalAlerts: (date: string) => Promise<React.ReactElement | null>;
  todayBalances: (date: string) => Promise<React.ReactElement>;
  quickActions: React.ReactElement;
}

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

export function DashboardClient({
  statsCards,
  criticalAlerts,
  todayBalances,
  quickActions,
}: DashboardClientProps) {
  // Estado inicial: HOY (gestión diaria prioritaria)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Formatear fecha para mostrar en título
  const dateLabel = isToday(selectedDate)
    ? "Hoy"
    : format(selectedDate, "d 'de' MMMM, yyyy", { locale: es });

  // Fecha ISO para pasar a componentes Server
  const dateISO = format(selectedDate, "yyyy-MM-dd");

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header con título dinámico */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Home className="h-8 w-8" />
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            {isToday(selectedDate) ? (
              "Resumen de alimentación de tus mascotas"
            ) : (
              <>
                Datos históricos del{" "}
                <span className="font-medium text-foreground">{dateLabel}</span>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Navegador Temporal */}
      <TemporalNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Stats Cards */}
      <Suspense key={`stats-${dateISO}`} fallback={<DashboardSkeleton />}>
        {statsCards(dateISO)}
      </Suspense>

      {/* Alertas críticas */}
      <Suspense key={`alerts-${dateISO}`} fallback={null}>
        {criticalAlerts(dateISO)}
      </Suspense>

      {/* Balance del día */}
      <Suspense
        key={`balance-${dateISO}`}
        fallback={<Skeleton className="h-96 w-full" />}
      >
        {todayBalances(dateISO)}
      </Suspense>

      {/* Acciones rápidas */}
      {quickActions}
    </div>
  );
}
