"use client";

import { format, subDays, addDays, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Home,
} from "lucide-react";
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
//   4. Presets para análisis rápido de días recientes
//
// USO PRINCIPAL: Control diario sin fricción
// USO SECUNDARIO: Análisis retrospectivo con navegación
//
// ============================================

export interface TemporalNavigatorProps {
  /** Fecha seleccionada (default: HOY) */
  selectedDate: Date;
  /** Callback cuando cambia la fecha */
  onDateChange: (date: Date) => void;
  /** Mostrar botón HOY destacado (default: true) */
  showTodayButton?: boolean;
  /** Resaltar visualmente HOY (default: true) */
  highlightToday?: boolean;
  /** Deshabilitar navegación futura (default: true) */
  disableFuture?: boolean;
  /** Clase CSS adicional */
  className?: string;
}

export function TemporalNavigator({
  selectedDate,
  onDateChange,
  showTodayButton = true,
  highlightToday = true,
  disableFuture = true,
  className,
}: TemporalNavigatorProps) {
  const today = new Date();
  const isCurrentlyToday = isToday(selectedDate);
  const canGoNext = !disableFuture || selectedDate < today;

  // Handlers
  const handlePrevDay = () => {
    onDateChange(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    if (canGoNext) {
      onDateChange(addDays(selectedDate, 1));
    }
  };

  const handleToday = () => {
    onDateChange(new Date());
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date);
    }
  };

  // Presets rápidos para análisis
  const datePresets = [
    { label: "Ayer", value: () => subDays(today, 1) },
    { label: "Hace 3 días", value: () => subDays(today, 3) },
    { label: "Hace 7 días", value: () => subDays(today, 7) },
    { label: "Hace 30 días", value: () => subDays(today, 30) },
  ];

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-3 p-4 bg-card rounded-lg border shadow-sm",
        className
      )}
    >
      {/* 🏠 BOTÓN HOY - PROMINENTE (Gestión Diaria) */}
      {showTodayButton && (
        <Button
          onClick={handleToday}
          disabled={isCurrentlyToday}
          variant={isCurrentlyToday ? "default" : "outline"}
          size="sm"
          className={cn(
            "gap-2 font-semibold",
            isCurrentlyToday && "cursor-default"
          )}
        >
          <Home className="h-4 w-4" />
          HOY
        </Button>
      )}

      {/* Separador visual */}
      {showTodayButton && (
        <div className="hidden sm:block h-8 w-px bg-border" />
      )}

      {/* Navegación temporal (secundaria) */}
      <div className="flex items-center gap-2">
        {/* Botón Anterior */}
        <Button
          onClick={handlePrevDay}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="sr-only">Día anterior</span>
        </Button>

        {/* Selector de fecha con calendario */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "min-w-[200px] justify-start text-left font-normal gap-2",
                highlightToday && isCurrentlyToday && "border-primary"
              )}
            >
              <CalendarIcon className="h-4 w-4" />
              <span className="font-medium">
                {isCurrentlyToday
                  ? "Hoy"
                  : format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center">
            <div className="p-3 border-b">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Accesos rápidos
              </p>
              <div className="flex flex-wrap gap-2">
                {datePresets.map((preset) => {
                  const presetDate = preset.value();
                  const isSelected = isSameDay(selectedDate, presetDate);
                  return (
                    <Button
                      key={preset.label}
                      onClick={() => handleDateSelect(presetDate)}
                      variant={isSelected ? "secondary" : "ghost"}
                      size="sm"
                      className="text-xs"
                    >
                      {preset.label}
                    </Button>
                  );
                })}
              </div>
            </div>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date: Date) => (disableFuture ? date > today : false)}
              initialFocus
              locale={es}
            />
          </PopoverContent>
        </Popover>

        {/* Botón Siguiente */}
        <Button
          onClick={handleNextDay}
          disabled={!canGoNext}
          variant="ghost"
          size="icon"
          className="h-9 w-9"
        >
          <ChevronRight className="h-4 w-4" />
          <span className="sr-only">Día siguiente</span>
        </Button>
      </div>

      {/* Indicador visual cuando NO es HOY */}
      {!isCurrentlyToday && (
        <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Viendo datos históricos</span>
        </div>
      )}
    </div>
  );
}
