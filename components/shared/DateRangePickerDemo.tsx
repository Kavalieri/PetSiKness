"use client";

import { useState } from "react";
import { DateRangePicker } from "./DateRangePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface DateRange {
  from: Date;
  to: Date;
}

/**
 * 🎯 Demo: DateRangePicker Component
 *
 * Ejemplo de uso del componente DateRangePicker para selección de rangos de fechas.
 */
export function DateRangePickerDemo() {
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>
            Demo: DateRangePicker
            {selectedRange && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                (
                {selectedRange.from.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                })}{" "}
                -{" "}
                {selectedRange.to.toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                )
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Picker */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Seleccionar Rango</h3>
            <DateRangePicker
              value={selectedRange}
              onChange={setSelectedRange}
            />
          </div>

          {/* Estado actual */}
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Estado Actual</h3>
            <div className="space-y-2 text-sm font-mono">
              <div>
                <strong>Rango:</strong>{" "}
                {selectedRange
                  ? `${selectedRange.from.toISOString().split("T")[0]} → ${
                      selectedRange.to.toISOString().split("T")[0]
                    }`
                  : "Sin selección (muestra todo)"}
              </div>
              {selectedRange && (
                <>
                  <div>
                    <strong>Días incluidos:</strong>{" "}
                    {Math.ceil(
                      (selectedRange.to.getTime() -
                        selectedRange.from.getTime()) /
                        (1000 * 60 * 60 * 24)
                    ) + 1}
                  </div>
                  <div>
                    <strong>Desde:</strong>{" "}
                    {selectedRange.from.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                  <div>
                    <strong>Hasta:</strong>{" "}
                    {selectedRange.to.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Ejemplos de uso */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Casos de Uso</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                ✅ <strong>Historial de Alimentación:</strong> Consultar
                registros de un período específico
              </li>
              <li>
                ✅ <strong>Analytics:</strong> Comparar métricas entre períodos
              </li>
              <li>
                ✅ <strong>Reportes:</strong> Generar informes de rangos
                personalizados
              </li>
              <li>
                ✅ <strong>Filtros Combinados:</strong> Período + mascota +
                alimento
              </li>
            </ul>
          </div>

          {/* Presets disponibles */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Presets Disponibles</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
              <div className="bg-primary/10 p-2 rounded">
                <strong>Hoy</strong>
                <p className="text-muted-foreground">Fecha actual</p>
              </div>
              <div className="bg-primary/10 p-2 rounded">
                <strong>Últimos 7 días</strong>
                <p className="text-muted-foreground">Última semana</p>
              </div>
              <div className="bg-primary/10 p-2 rounded">
                <strong>Últimos 30 días</strong>
                <p className="text-muted-foreground">Último mes</p>
              </div>
              <div className="bg-primary/10 p-2 rounded">
                <strong>Esta semana</strong>
                <p className="text-muted-foreground">Lunes-Domingo</p>
              </div>
              <div className="bg-primary/10 p-2 rounded">
                <strong>Este mes</strong>
                <p className="text-muted-foreground">1-último día</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
