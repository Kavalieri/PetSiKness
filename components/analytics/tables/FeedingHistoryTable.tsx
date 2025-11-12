"use client";

import { useEffect, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
  flexRender,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, Loader2, Download, FileText, FileSpreadsheet } from "lucide-react";
import {
  getFeedingHistory,
  type FeedingHistoryData,
} from "@/lib/actions/analytics-data";
import { feedingHistoryColumns } from "./columns/feedingColumns";
import {
  exportToCSV,
  formatDateForCSV,
  formatGramsForCSV,
  generateFeedingHistoryPDF,
} from "@/lib/export";

// ============================================
// TYPES
// ============================================

interface FeedingHistoryTableProps {
  /**
   * ID de la mascota (opcional - si no se especifica muestra todas)
   */
  petId?: string;

  /**
   * Número inicial de registros por página
   * @default 10
   */
  pageSize?: number;

  /**
   * Título personalizado
   */
  title?: string;
}

// ============================================
// COMPONENT
// ============================================

/**
 * Tabla de historial de alimentación con TanStack Table
 *
 * Features:
 * - Sorting por columnas
 * - Paginación
 * - Loading states
 * - Responsive
 *
 * @example
 * ```tsx
 * <FeedingHistoryTable petId="pet-123" pageSize={10} />
 * ```
 */
export function FeedingHistoryTable({
  petId,
  pageSize = 10,
  title = "Historial de Alimentación",
}: FeedingHistoryTableProps) {
  const [data, setData] = useState<FeedingHistoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getFeedingHistory(petId, 100); // Traer primeros 100

      if (result.ok) {
        setData(result.data || []);
      } else {
        setError(result.message);
      }

      setLoading(false);
    }

    fetchData();
  }, [petId]);

  const table = useReactTable({
    data,
    columns: feedingHistoryColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    state: {
      sorting,
      columnFilters,
    },
    initialState: {
      pagination: {
        pageSize,
      },
    },
  });

  // ============================================
  // EXPORT HANDLERS
  // ============================================

  const handleExportCSV = () => {
    exportToCSV({
      filename: `historial-alimentacion-${new Date().toISOString().split("T")[0]}`,
      columns: [
        { key: "date", header: "Fecha", formatter: formatDateForCSV },
        { key: "time", header: "Hora" },
        { key: "petName", header: "Mascota" },
        { key: "foodName", header: "Alimento" },
        { key: "served", header: "Servido (g)", formatter: formatGramsForCSV },
        { key: "eaten", header: "Comido (g)", formatter: formatGramsForCSV },
        { key: "leftover", header: "Sobra (g)", formatter: formatGramsForCSV },
        { key: "appetiteRating", header: "Apetito" },
      ],
      data: data as unknown as Record<string, unknown>[],
    });
  };

  const handleExportPDF = () => {
    // Determinar rango de fechas
    const dates = data.map((d) => new Date(d.date).getTime()).filter((d) => !isNaN(d));
    const minDate = dates.length > 0 ? new Date(Math.min(...dates)) : new Date();
    const maxDate = dates.length > 0 ? new Date(Math.max(...dates)) : new Date();

    generateFeedingHistoryPDF(
      data.map((d) => ({
        date: formatDateForCSV(d.date),
        time: d.time || "-",
        petName: d.petName,
        foodName: d.foodName,
        served: d.served,
        eaten: d.eaten,
        leftover: d.leftover,
        appetite: d.appetiteRating || "-",
      })),
      {
        start: minDate.toLocaleDateString("es-ES"),
        end: maxDate.toLocaleDateString("es-ES"),
      }
    );
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>{title}</CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={data.length === 0}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportCSV}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Exportar a CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF}>
              <FileText className="h-4 w-4 mr-2" />
              Exportar a PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && data.length === 0 && (
          <div className="flex items-center justify-center py-8">
            <p className="text-sm text-muted-foreground">
              No hay registros de alimentación
            </p>
          </div>
        )}

        {/* Table */}
        {!loading && !error && data.length > 0 && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <TableHead key={header.id}>
                          {header.isPlaceholder
                            ? null
                            : flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                        </TableHead>
                      ))}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.length > 0 ? (
                    table.getRowModel().rows.map((row) => (
                      <TableRow key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <TableCell key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={feedingHistoryColumns.length}
                        className="h-24 text-center"
                      >
                        No se encontraron resultados.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {table.getState().pagination.pageIndex * pageSize + 1}{" "}
                a{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) * pageSize,
                  data.length
                )}{" "}
                de {data.length} registros
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
