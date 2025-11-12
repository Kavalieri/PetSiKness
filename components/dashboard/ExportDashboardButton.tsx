"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileText } from "lucide-react";
import { generateDashboardPDF } from "@/lib/export";
import { useState } from "react";

// ============================================
// TYPES
// ============================================

interface ExportDashboardButtonProps {
  date: string;
  overview: {
    totalPets: number;
    petsOnTrack: number;
    alerts: number;
    avgWeeklyAchievement: number;
  };
  balances: {
    petName: string;
    served: number;
    eaten: number;
    goal: number;
    percentage: number;
    status: string;
  }[];
}

// ============================================
// COMPONENT
// ============================================

export function ExportDashboardButton({
  date,
  overview,
  balances,
}: ExportDashboardButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleExportPDF = () => {
    setLoading(true);

    try {
      generateDashboardPDF(date, overview, balances);
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
          Resumen del día (PDF)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
