"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText } from "lucide-react";
import { generateAnalyticsPDF } from "@/lib/export";
import { getDailyConsumptionTrend } from "@/lib/actions/analytics-data";
import { useState } from "react";

// ============================================
// TYPES
// ============================================

interface ExportAnalyticsButtonProps {
  metrics: {
    totalPets: number;
    totalFeedings: number;
    avgConsumption: number;
    daysWithData: number;
  };
}

// ============================================
// COMPONENT
// ============================================

export function ExportAnalyticsButton({ metrics }: ExportAnalyticsButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = async () => {
    setLoading(true);

    try {
      // Obtener datos de tendencia (últimos 30 días)
      const trendResult = await getDailyConsumptionTrend("30");

      if (trendResult.ok && trendResult.data) {
        const trendData = trendResult.data.map((d) => ({
          date: new Date(d.date).toLocaleDateString("es-ES"),
          served: d.served,
          eaten: d.eaten,
          goal: d.goal,
        }));

        generateAnalyticsPDF(metrics, trendData);
      } else {
        // Fallback: generar sin datos de tendencia
        generateAnalyticsPDF(metrics, []);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={loading}>
          <Download className="h-4 w-4 mr-2" />
          {loading ? "Generando..." : "Exportar"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportPDF}>
          <FileText className="h-4 w-4 mr-2" />
          Reporte completo (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
