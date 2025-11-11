"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { formatGrams } from "@/lib/config/chart-theme";
import type { FeedingHistoryData } from "@/lib/actions/analytics-data";

// ============================================
// HELPERS
// ============================================

function getAppetiteVariant(
  rating: string | null
): "default" | "secondary" | "destructive" | "outline" {
  if (!rating) return "outline";

  const variants: Record<string, "default" | "secondary" | "destructive"> = {
    excellent: "default",
    good: "default",
    normal: "secondary",
    poor: "destructive",
    refused: "destructive",
  };

  return variants[rating] || "outline";
}

function getAppetiteLabel(rating: string | null): string {
  if (!rating) return "N/A";

  const labels: Record<string, string> = {
    excellent: "Excelente",
    good: "Bueno",
    normal: "Normal",
    poor: "Pobre",
    refused: "Rechazó",
  };

  return labels[rating] || rating;
}

// ============================================
// COLUMN DEFINITIONS
// ============================================

export const feedingHistoryColumns: ColumnDef<FeedingHistoryData>[] = [
  {
    accessorKey: "date",
    header: "Fecha",
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    },
  },
  {
    accessorKey: "time",
    header: "Hora",
    cell: ({ row }) => {
      const time = row.getValue("time") as string;
      return time !== "N/A" ? time : "-";
    },
  },
  {
    accessorKey: "petName",
    header: "Mascota",
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue("petName")}</span>
    ),
  },
  {
    accessorKey: "foodName",
    header: "Alimento",
  },
  {
    accessorKey: "portionNumber",
    header: "Ración",
    cell: ({ row }) => {
      const portion = row.getValue("portionNumber") as number;
      return portion > 0 ? `#${portion}` : "-";
    },
  },
  {
    accessorKey: "served",
    header: "Servido",
    cell: ({ row }) => formatGrams(row.getValue("served") as number),
  },
  {
    accessorKey: "eaten",
    header: "Comido",
    cell: ({ row }) => formatGrams(row.getValue("eaten") as number),
  },
  {
    accessorKey: "leftover",
    header: "Sobra",
    cell: ({ row }) => {
      const leftover = row.getValue("leftover") as number;
      return (
        <span className={leftover > 0 ? "text-warning font-medium" : ""}>
          {formatGrams(leftover)}
        </span>
      );
    },
  },
  {
    accessorKey: "appetiteRating",
    header: "Apetito",
    cell: ({ row }) => {
      const rating = row.getValue("appetiteRating") as string | null;
      return (
        <Badge variant={getAppetiteVariant(rating)}>
          {getAppetiteLabel(rating)}
        </Badge>
      );
    },
  },
];
