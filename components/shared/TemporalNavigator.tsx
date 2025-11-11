"use client";

import { useState } from "react";
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isToday as isTodayFn,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// ============================================
// 🎯 FILOSOFÍA: GESTIÓN DIARIA PRIORITARIA
// ============================================
//
// Este componente prioriza la gestión del DÍA ACTUAL (HOY):
//
// DISEÑO UX:
//   1. Botón "HOY" siempre prominente y visible
//   2. Fecha actual como estado inicial por defecto
//   3. Navegación temporal como capacidad secundaria
//   4. Presets para análisis rápido de períodos
//
// USO PRINCIPAL: Control diario sin fricción
// USO SECUNDARIO: Análisis retrospectivo con navegación multi-período
//
// ============================================

// ============================================
// TIPOS
// ============================================

export type ViewMode = "day" | "week" | "month" | "year";

export interface TemporalNavigatorProps {
  /** Modo de visualización actual */
  mode: ViewMode;
  /** Fecha seleccionada */
  selectedDate: Date;
  /** Callback cuando cambia la fecha */
  onDateChange: (date: Date) => void;
  /** Callback cuando cambia el modo */
  onModeChange?: (mode: ViewMode) => void;
  /** Mostrar selector de modo (día/semana/mes/año) */
  showModeSelector?: boolean;
  /** Mostrar botón de shortcuts "Hoy" */
  showShortcuts?: boolean;
  /** Fecha mínima permitida */
  minDate?: Date;
  /** Fecha máxima permitida (default: hoy) */
  maxDate?: Date;
  /** Clase adicional */
  className?: string;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Formatea el rango de fecha según el modo de vista
 */
function formatDateRange(date: Date, mode: ViewMode): string {
  switch (mode) {
    case "day":
      return format(date, "d MMM yyyy", { locale: es });
    case "week": {
      const start = startOfWeek(date, { weekStartsOn: 1 });
      const end = endOfWeek(date, { weekStartsOn: 1 });
      return `${format(start, "d MMM", { locale: es })} - ${format(
        end,
        "d MMM yyyy",
        { locale: es }
      )}`;
    }
    case "month":
      return format(date, "MMMM yyyy", { locale: es });
    case "year":
      return format(date, "yyyy");
    default:
      return format(date, "d MMM yyyy", { locale: es });
  }
}

/**
 * Obtiene el período anterior según el modo
 */
function getPreviousPeriod(date: Date, mode: ViewMode): Date {
  switch (mode) {
    case "day":
      return subDays(date, 1);
    case "week":
      return subWeeks(date, 1);
    case "month":
      return subMonths(date, 1);
    case "year":
      return subYears(date, 1);
    default:
      return subDays(date, 1);
  }
}

/**
 * Obtiene el siguiente período según el modo
 */
function getNextPeriod(date: Date, mode: ViewMode): Date {
  switch (mode) {
    case "day":
      return addDays(date, 1);
    case "week":
      return addWeeks(date, 1);
    case "month":
      return addMonths(date, 1);
    case "year":
      return addYears(date, 1);
    default:
      return addDays(date, 1);
  }
}

/**
 * Verifica si la fecha está en el período actual (hoy según el modo)
 */
function isCurrentPeriod(date: Date, mode: ViewMode): boolean {
  const today = new Date();

  switch (mode) {
    case "day":
      return isTodayFn(date);
    case "week": {
      const weekStart = startOfWeek(today, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
      return date >= weekStart && date <= weekEnd;
    }
    case "month": {
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      return date >= monthStart && date <= monthEnd;
    }
    case "year": {
      const yearStart = startOfYear(today);
      const yearEnd = endOfYear(today);
      return date >= yearStart && date <= yearEnd;
    }
    default:
      return false;
  }
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

/**
 * 📅 TemporalNavigator
 *
 * Componente de navegación temporal reutilizable para Dashboard y Alimentación.
 *
 * **Características**:
 * - 4 modos de vista: Día, Semana, Mes, Año
 * - Navegación anterior/siguiente
 * - Selector de fecha con calendario
 * - Shortcut "Hoy"
 * - Responsive mobile-first
 *
 * @example
 * ```tsx
 * const [date, setDate] = useState(new Date());
 * const [mode, setMode] = useState<ViewMode>("day");
 *
 * <TemporalNavigator
 *   mode={mode}
 *   selectedDate={date}
 *   onDateChange={setDate}
 *   onModeChange={setMode}
 *   showModeSelector
 *   showShortcuts
 * />
 * ```
 */
export function TemporalNavigator({
  mode,
  selectedDate,
  onDateChange,
  onModeChange,
  showModeSelector = true,
  showShortcuts = true,
  minDate,
  maxDate = new Date(),
  className,
}: TemporalNavigatorProps) {
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Handlers
  const handlePrevious = () => {
    const newDate = getPreviousPeriod(selectedDate, mode);
    if (!minDate || newDate >= minDate) {
      onDateChange(newDate);
    }
  };

  const handleNext = () => {
    const newDate = getNextPeriod(selectedDate, mode);
    if (newDate <= maxDate) {
      onDateChange(newDate);
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
      setCalendarOpen(false);
    }
  };

  // Verificaciones
  const canGoPrevious =
    !minDate || getPreviousPeriod(selectedDate, mode) >= minDate;
  const canGoNext = getNextPeriod(selectedDate, mode) <= maxDate;
  const isInCurrentPeriod = isCurrentPeriod(selectedDate, mode);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Navegación Principal */}
      <div className="flex items-center justify-between gap-2">
        {/* Botón Anterior */}
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className="h-9 w-9 shrink-0"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Período anterior</span>
        </Button>

        {/* Selector de Fecha */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="h-9 flex-1 font-semibold justify-center gap-2 min-w-0"
            >
              <Calendar className="h-4 w-4 shrink-0" />
              <span className="truncate">
                {formatDateRange(selectedDate, mode)}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={handleCalendarSelect}
              disabled={(date) => (minDate && date < minDate) || date > maxDate}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>

        {/* Botón Siguiente */}
        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={!canGoNext}
          className="h-9 w-9 shrink-0"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Siguiente período</span>
        </Button>
      </div>

      {/* Selector de Modo + Shortcuts */}
      {(showModeSelector || showShortcuts) && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Selector de Modo */}
          {showModeSelector && onModeChange && (
            <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
              <Button
                variant={mode === "day" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onModeChange("day")}
                className="h-7 px-3 text-xs"
              >
                Día
              </Button>
              <Button
                variant={mode === "week" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onModeChange("week")}
                className="h-7 px-3 text-xs"
              >
                Semana
              </Button>
              <Button
                variant={mode === "month" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onModeChange("month")}
                className="h-7 px-3 text-xs"
              >
                Mes
              </Button>
              <Button
                variant={mode === "year" ? "secondary" : "ghost"}
                size="sm"
                onClick={() => onModeChange("year")}
                className="h-7 px-3 text-xs"
              >
                Año
              </Button>
            </div>
          )}

          {/* Botón Hoy */}
          {showShortcuts && (
            <Button
              variant={isInCurrentPeriod ? "secondary" : "outline"}
              size="sm"
              onClick={handleToday}
              disabled={isInCurrentPeriod}
              className="h-7 px-3 text-xs gap-1.5"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Hoy</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
