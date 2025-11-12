"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/shared/DateRangePicker";
import { FeedingList } from "@/components/feeding/FeedingList";
import { deleteFeeding } from "./actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

// ============================================
// 🎯 FILOSOFÍA: HISTORIAL COMPLETO CON FILTROS OPCIONALES
// ============================================
//
// FeedingPageClient maneja la navegación temporal para el historial
// de alimentación.
//
// DIFERENCIA con Dashboard:
//   - Dashboard: Foco en HOY (gestión diaria)
//   - Feeding: Foco en HISTORIAL (análisis retrospectivo)
//
// COMPORTAMIENTO:
//   1. Estado inicial: SIN FILTRO (muestra todo el historial)
//   2. Usuario puede filtrar por rango de fechas opcional
//   3. URL se actualiza con queryParams para compartir filtros
//   4. Presets útiles: Hoy, Últimos 7/30 días, Esta semana/mes
//
// ============================================

interface Pet {
  id: string;
  name: string;
}

interface Food {
  id: string;
  name: string;
  brand: string | null;
}

interface FeedingWithRelations {
  id: string;
  household_id: string;
  pet_id: string;
  pet_name: string;
  food_id: string;
  food_name: string;
  food_brand: string | null;
  feeding_date: string;
  feeding_time: string | null;
  portion_number: number | null;
  amount_served_grams: number;
  amount_eaten_grams: number;
  amount_leftover_grams: number | null;
  appetite_rating: string | null;
  eating_speed: string | null;
  vomited: boolean | null;
  had_diarrhea: boolean | null;
  had_stool: boolean | null;
  stool_quality: string | null;
  notes: string | null;
  created_at: Date;
}

interface FeedingPageClientProps {
  feedings: FeedingWithRelations[];
  pets: Pet[];
  foods: Food[];
  initialStartDate?: string;
  initialEndDate?: string;
}

interface DateRange {
  from: Date;
  to: Date;
}

export function FeedingPageClient({
  feedings,
  pets,
  foods,
  initialStartDate,
  initialEndDate,
}: FeedingPageClientProps) {
  const router = useRouter();

  // Estado del rango de fechas (undefined = sin filtro)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (initialStartDate && initialEndDate) {
      return {
        from: new Date(initialStartDate),
        to: new Date(initialEndDate),
      };
    }
    return undefined;
  });

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);

    // Actualizar URL con queryParams
    const params = new URLSearchParams(window.location.search);

    if (range) {
      params.set("startDate", format(range.from, "yyyy-MM-dd"));
      params.set("endDate", format(range.to, "yyyy-MM-dd"));
    } else {
      params.delete("startDate");
      params.delete("endDate");
    }

    // Navegar con nuevos params
    router.push(`/feeding?${params.toString()}`);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteFeeding(id);

    if (result.ok) {
      toast.success("Registro eliminado");
      router.refresh();
    } else {
      toast.error(result.message);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header - Mobile: Stack vertical, Desktop: Flex horizontal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Alimentación
          </h1>
          <p className="text-sm text-muted-foreground">
            {dateRange
              ? `Registros del ${format(
                  dateRange.from,
                  "dd/MM/yyyy"
                )} al ${format(dateRange.to, "dd/MM/yyyy")}`
              : "Historial completo de registros de alimentación"}
          </p>
        </div>
        <Button asChild size="default" className="w-full sm:w-auto">
          <Link href="/feeding/new-unified">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Comida
          </Link>
        </Button>
      </div>

      {/* Filtro de rango de fechas - Mobile: Stack, Desktop: Flex */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex-1">
          <DateRangePicker value={dateRange} onChange={handleDateRangeChange} />
        </div>
        <div className="text-sm text-muted-foreground text-center sm:text-left">
          {feedings.length === 0
            ? "No hay registros"
            : `${feedings.length} registro${feedings.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Lista de feedings */}
      <FeedingList
        feedings={feedings}
        pets={pets}
        foods={foods}
        onDelete={handleDelete}
      />
    </div>
  );
}
