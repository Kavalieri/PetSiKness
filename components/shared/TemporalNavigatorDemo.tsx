"use client";

import { useState } from "react";
import { TemporalNavigator } from "./TemporalNavigator";
import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Componente de demostración del TemporalNavigator
 * 
 * Muestra cómo integrar el navegador temporal con el enfoque de gestión diaria.
 * Sirve como referencia para la integración en Dashboard y Alimentación.
 */
export function TemporalNavigatorDemo() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  return (
    <div className="space-y-6">
      {/* Navegador Temporal */}
      <TemporalNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Indicador de fecha seleccionada */}
      <div className="p-6 bg-muted rounded-lg">
        <h3 className="text-lg font-semibold mb-2">Fecha Seleccionada:</h3>
        <p className="text-2xl font-bold text-primary">
          {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          {selectedDate.toISOString().split("T")[0]}
        </p>
      </div>

      {/* Información de uso */}
      <div className="p-6 bg-card border rounded-lg space-y-4">
        <h3 className="text-lg font-semibold">🎯 Filosofía de Uso:</h3>
        
        <div className="space-y-3 text-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              1
            </div>
            <div>
              <p className="font-medium">Gestión Diaria (Principal)</p>
              <p className="text-muted-foreground">
                Al entrar, siempre muestra HOY. El botón &quot;HOY&quot; está destacado y permite volver rápidamente.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-xs font-bold">
              2
            </div>
            <div>
              <p className="font-medium">Navegación Temporal (Secundaria)</p>
              <p className="text-muted-foreground">
                Usa flechas o calendario para análisis retrospectivo. Presets rápidos para días comunes.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold">
              ⚠
            </div>
            <div>
              <p className="font-medium">Indicador Histórico</p>
              <p className="text-muted-foreground">
                Cuando NO estás en HOY, aparece un indicador visual para recordarte que ves datos pasados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
