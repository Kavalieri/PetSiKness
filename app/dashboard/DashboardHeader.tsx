"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, isToday } from "date-fns";
import { es } from "date-fns/locale";
import { TemporalNavigator } from "@/components/shared/TemporalNavigator";
import { Home } from "lucide-react";

// ============================================
// 🎯 FILOSOFÍA: GESTIÓN DIARIA PRIORITARIA
// ============================================
//
// DashboardHeader maneja SOLO la navegación temporal.
// El contenido se renderiza en el Server Component (page.tsx)
// que lee los searchParams.
//
// COMPORTAMIENTO:
//   1. Lee fecha inicial de URL (?date=...)
//   2. TemporalNavigator permite cambiar fecha
//   3. Navega a nueva URL con queryParam
//   4. Server Component se re-renderiza con nueva fecha
//
// ============================================

export function DashboardHeader() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Leer fecha de URL o usar HOY por defecto
  const dateParam = searchParams.get("date");
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    return dateParam ? new Date(dateParam) : new Date();
  });

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    
    // Navegar a nueva URL con fecha
    const dateISO = format(date, "yyyy-MM-dd");
    const params = new URLSearchParams(searchParams.toString());
    
    // Si es HOY, remover el parámetro (DEFAULT)
    const today = format(new Date(), "yyyy-MM-dd");
    if (dateISO === today) {
      params.delete("date");
    } else {
      params.set("date", dateISO);
    }
    
    router.push(`/dashboard?${params.toString()}`);
  };

  // Formatear para UI
  const dateLabel = isToday(selectedDate)
    ? "Hoy"
    : format(selectedDate, "d 'de' MMMM, yyyy", { locale: es });

  return (
    <>
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
        onDateChange={handleDateChange}
      />
    </>
  );
}
