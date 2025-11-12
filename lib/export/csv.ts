/**
 * CSV Export Utilities
 *
 * Funciones helper para exportar datos a CSV.
 * Implementación nativa sin dependencias externas.
 */

// ============================================
// TYPES
// ============================================

export interface CSVColumn {
  key: string;
  header: string;
  formatter?: (value: unknown) => string;
}

export interface CSVExportOptions {
  filename: string;
  columns: CSVColumn[];
  data: Record<string, unknown>[];
}

// ============================================
// HELPERS
// ============================================

/**
 * Escapa valores CSV (comillas, comas, saltos de línea)
 */
function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  const str = String(value);

  // Si contiene comillas, comas o saltos de línea, escapar
  if (str.includes('"') || str.includes(",") || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Convierte array de objetos a string CSV
 */
function arrayToCSV(options: CSVExportOptions): string {
  const { columns, data } = options;

  // Headers
  const headers = columns.map((col) => escapeCSVValue(col.header)).join(",");

  // Rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : value;
        return escapeCSVValue(formatted);
      })
      .join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Descarga string como archivo CSV
 */
function downloadCSV(content: string, filename: string): void {
  const blob = new Blob(["\ufeff" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Exporta datos a CSV y descarga automáticamente
 */
export function exportToCSV(options: CSVExportOptions): void {
  const csv = arrayToCSV(options);
  const filename = options.filename.endsWith(".csv")
    ? options.filename
    : `${options.filename}.csv`;
  downloadCSV(csv, filename);
}

// ============================================
// FORMATTERS COMUNES
// ============================================

/**
 * Formatea fecha ISO a DD/MM/YYYY
 */
export function formatDateForCSV(date: unknown): string {
  if (!date) return "";
  const d = new Date(String(date));
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("es-ES");
}

/**
 * Formatea número con 2 decimales
 */
export function formatNumberForCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  return num.toFixed(2);
}

/**
 * Formatea gramos
 */
export function formatGramsForCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  return `${num}g`;
}

/**
 * Formatea porcentaje
 */
export function formatPercentageForCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const num = Number(value);
  if (isNaN(num)) return "";
  return `${num.toFixed(1)}%`;
}

/**
 * Formatea booleano a Sí/No
 */
export function formatBooleanForCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  return value ? "Sí" : "No";
}
