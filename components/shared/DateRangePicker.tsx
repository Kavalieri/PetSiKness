"use client";

import { useState } from "react";
import {
  format,
  subDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { es } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================
// 🎯 FILOSOFÍA: ANÁLISIS HISTÓRICO CON PRESETS ÚTILES
// ============================================
//
// DateRangePicker para seleccionar rangos de fechas en vistas
// de historial (ej: Feeding).
//
// DIFERENCIA con TemporalNavigator:
//   - TemporalNavigator: Navegación día a día (Dashboard)
//   - DateRangePicker: Rangos flexibles (Historial)
//
// COMPORTAMIENTO:
//   1. Sin selección inicial (muestra TODO el historial)
//   2. Presets útiles: Hoy, Últimos 7/30 días, Esta semana/mes
//   3. Selección custom con dos calendarios
//   4. Botón "Limpiar" para volver a mostrar todo
//
// ============================================

interface DateRange {
  from: Date;
  to: Date;
}

interface DateRangePickerProps {
  /** Rango seleccionado (undefined = sin filtro) */
  value?: DateRange;
  /** Callback cuando cambia el rango */
  onChange: (range: DateRange | undefined) => void;
  /** Deshabilitar fechas futuras */
  disableFuture?: boolean;
}

export function DateRangePicker({
  value,
  onChange,
  disableFuture = true,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Presets útiles
  const presets = [
    {
      label: "Hoy",
      getRange: () => {
        const today = new Date();
        return { from: today, to: today };
      },
    },
    {
      label: "Últimos 7 días",
      getRange: () => {
        const today = new Date();
        return { from: subDays(today, 6), to: today };
      },
    },
    {
      label: "Últimos 30 días",
      getRange: () => {
        const today = new Date();
        return { from: subDays(today, 29), to: today };
      },
    },
    {
      label: "Esta semana",
      getRange: () => {
        const today = new Date();
        return {
          from: startOfWeek(today, { locale: es }),
          to: endOfWeek(today, { locale: es }),
        };
      },
    },
    {
      label: "Este mes",
      getRange: () => {
        const today = new Date();
        return { from: startOfMonth(today), to: endOfMonth(today) };
      },
    },
  ];

  const handlePresetClick = (getRange: () => DateRange) => {
    onChange(getRange());
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange(undefined);
    setIsOpen(false);
  };

  const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      onChange({ from: range.from, to: range.to });
    } else if (range?.from) {
      // Solo "from" seleccionado, esperar "to"
      // No hacemos nada aún
    }
  };

  // Formatear label del botón
  const buttonLabel = value
    ? `${format(value.from, "dd MMM", { locale: es })} - ${format(
        value.to,
        "dd MMM yyyy",
        { locale: es }
      )}`
    : "Seleccionar período";

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {buttonLabel}
          {value && (
            <X
              className="ml-auto h-4 w-4 opacity-50 hover:opacity-100"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets */}
          <div className="flex flex-col gap-2 p-3 border-r">
            <div className="text-xs font-semibold text-muted-foreground mb-1">
              Períodos
            </div>
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8"
                onClick={() => handlePresetClick(preset.getRange)}
              >
                {preset.label}
              </Button>
            ))}
            <div className="border-t pt-2 mt-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start text-xs h-8 w-full text-muted-foreground"
                onClick={handleClear}
              >
                <X className="mr-2 h-3 w-3" />
                Limpiar filtro
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <div className="p-3">
            <Calendar
              mode="range"
              selected={value ? { from: value.from, to: value.to } : undefined}
              onSelect={handleSelect}
              numberOfMonths={2}
              disabled={disableFuture ? { after: new Date() } : undefined}
              locale={es}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
