/**
 * PDF Export Utilities
 *
 * Funciones helper para generar reportes PDF con jsPDF y jspdf-autotable.
 * Diseño: Logo + header + contenido + footer con fecha.
 */

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ============================================
// TYPES
// ============================================

export interface PDFTableColumn {
  header: string;
  dataKey: string;
}

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  tables?: {
    title: string;
    columns: PDFTableColumn[];
    data: Record<string, unknown>[];
  }[];
  sections?: {
    title: string;
    content: string[];
  }[];
}

// ============================================
// CONSTANTS
// ============================================

const PRIMARY_COLOR: [number, number, number] = [59, 130, 246]; // blue-500
const TEXT_COLOR: [number, number, number] = [51, 51, 51]; // gray-800
const SECONDARY_COLOR: [number, number, number] = [107, 114, 128]; // gray-500

// ============================================
// HELPERS
// ============================================

/**
 * Configura header del documento
 */
function addHeader(doc: jsPDF, title: string, subtitle?: string): number {
  let yPosition = 20;

  // Logo/Brand
  doc.setFontSize(18);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text("🐾 Pet SiKness", 20, yPosition);

  yPosition += 10;

  // Título principal
  doc.setFontSize(16);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(title, 20, yPosition);

  yPosition += 8;

  // Subtítulo (opcional)
  if (subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(...SECONDARY_COLOR);
    doc.text(subtitle, 20, yPosition);
    yPosition += 8;
  }

  // Línea separadora
  doc.setDrawColor(...PRIMARY_COLOR);
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);

  yPosition += 10;

  return yPosition;
}

/**
 * Agrega footer con fecha de generación
 */
function addFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Fecha de generación
    doc.setFontSize(8);
    doc.setTextColor(...SECONDARY_COLOR);
    const dateStr = new Date().toLocaleString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    doc.text(`Generado: ${dateStr}`, 20, 285);

    // Número de página
    doc.text(`Página ${i} de ${pageCount}`, 170, 285);
  }
}

/**
 * Agrega tabla con autoTable
 */
function addTable(
  doc: jsPDF,
  startY: number,
  tableData: {
    title: string;
    columns: PDFTableColumn[];
    data: Record<string, unknown>[];
  }
): number {
  const { title, columns, data } = tableData;

  // Título de la tabla
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(title, 20, startY);

  startY += 6;

  // Generar tabla
  autoTable(doc, {
    startY,
    head: [columns.map((col) => col.header)],
    body: data.map((row) =>
      columns.map((col) => {
        const value = row[col.dataKey];
        if (value === null || value === undefined) return "";
        return String(value);
      })
    ),
    theme: "striped",
    headStyles: {
      fillColor: PRIMARY_COLOR,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 10,
    },
    bodyStyles: {
      textColor: TEXT_COLOR,
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // gray-50
    },
    margin: { left: 20, right: 20 },
  });

  // @ts-expect-error - autoTable adds finalY to doc
  return doc.lastAutoTable.finalY + 10;
}

/**
 * Agrega sección de texto
 */
function addSection(
  doc: jsPDF,
  startY: number,
  section: { title: string; content: string[] }
): number {
  let yPosition = startY;

  // Título de sección
  doc.setFontSize(12);
  doc.setTextColor(...TEXT_COLOR);
  doc.text(section.title, 20, yPosition);

  yPosition += 8;

  // Contenido
  doc.setFontSize(10);
  doc.setTextColor(...SECONDARY_COLOR);

  section.content.forEach((line) => {
    // Check page overflow
    if (yPosition > 270) {
      doc.addPage();
      yPosition = 20;
    }

    doc.text(line, 20, yPosition);
    yPosition += 6;
  });

  yPosition += 5;

  return yPosition;
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Genera y descarga reporte PDF completo
 */
export function generatePDFReport(options: PDFReportOptions): void {
  const doc = new jsPDF();

  // Header
  let yPosition = addHeader(doc, options.title, options.subtitle);

  // Secciones de texto
  if (options.sections) {
    options.sections.forEach((section) => {
      // Check page overflow
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition = addSection(doc, yPosition, section);
    });
  }

  // Tablas
  if (options.tables) {
    options.tables.forEach((table) => {
      // Check page overflow (considerar espacio para tabla)
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      yPosition = addTable(doc, yPosition, table);
    });
  }

  // Footer
  addFooter(doc);

  // Descargar
  const filename = options.filename.endsWith(".pdf")
    ? options.filename
    : `${options.filename}.pdf`;

  doc.save(filename);
}

// ============================================
// PRESET REPORTS
// ============================================

/**
 * Genera reporte de historial de alimentación
 */
export function generateFeedingHistoryPDF(
  data: {
    date: string;
    time: string;
    petName: string;
    foodName: string;
    served: number;
    eaten: number;
    leftover: number;
    appetite: string;
  }[],
  dateRange: { start: string; end: string }
): void {
  generatePDFReport({
    title: "Historial de Alimentación",
    subtitle: `Periodo: ${dateRange.start} - ${dateRange.end}`,
    filename: `historial-alimentacion-${dateRange.start}-${dateRange.end}`,
    tables: [
      {
        title: "Registros de Alimentación",
        columns: [
          { header: "Fecha", dataKey: "date" },
          { header: "Hora", dataKey: "time" },
          { header: "Mascota", dataKey: "petName" },
          { header: "Alimento", dataKey: "foodName" },
          { header: "Servido", dataKey: "served" },
          { header: "Comido", dataKey: "eaten" },
          { header: "Sobra", dataKey: "leftover" },
          { header: "Apetito", dataKey: "appetite" },
        ],
        data,
      },
    ],
  });
}

/**
 * Genera reporte de analytics con métricas y tendencias
 */
export function generateAnalyticsPDF(
  metrics: {
    totalPets: number;
    totalFeedings: number;
    avgConsumption: number;
    daysWithData: number;
  },
  trendData: {
    date: string;
    served: number;
    eaten: number;
    goal: number;
  }[]
): void {
  // Calcular resumen
  const totalServed = trendData.reduce((sum, d) => sum + d.served, 0);
  const totalEaten = trendData.reduce((sum, d) => sum + d.eaten, 0);
  const avgGoalAchievement =
    trendData.length > 0
      ? ((totalServed / trendData.reduce((sum, d) => sum + d.goal, 0)) * 100).toFixed(1)
      : "0";

  generatePDFReport({
    title: "Reporte de Analytics",
    subtitle: "Resumen de datos nutricionales",
    filename: `analytics-${new Date().toISOString().split("T")[0]}`,
    sections: [
      {
        title: "Métricas Generales",
        content: [
          `Mascotas activas: ${metrics.totalPets}`,
          `Total alimentaciones: ${metrics.totalFeedings}`,
          `Consumo promedio: ${metrics.avgConsumption}g por alimentación`,
          `Días con datos: ${metrics.daysWithData}`,
        ],
      },
      {
        title: "Resumen de Tendencias",
        content: [
          `Total servido: ${totalServed}g`,
          `Total comido: ${totalEaten}g`,
          `Promedio cumplimiento de meta: ${avgGoalAchievement}%`,
        ],
      },
    ],
    tables: [
      {
        title: "Tendencia Diaria",
        columns: [
          { header: "Fecha", dataKey: "date" },
          { header: "Servido (g)", dataKey: "served" },
          { header: "Comido (g)", dataKey: "eaten" },
          { header: "Meta (g)", dataKey: "goal" },
        ],
        data: trendData,
      },
    ],
  });
}

/**
 * Genera reporte de dashboard diario
 */
export function generateDashboardPDF(
  date: string,
  overview: {
    totalPets: number;
    petsOnTrack: number;
    alerts: number;
    avgWeeklyAchievement: number;
  },
  balances: {
    petName: string;
    served: number;
    eaten: number;
    goal: number;
    percentage: number;
    status: string;
  }[]
): void {
  generatePDFReport({
    title: `Resumen del Dashboard - ${date}`,
    subtitle: "Estado general de alimentación",
    filename: `dashboard-${date}`,
    sections: [
      {
        title: "Estadísticas del Día",
        content: [
          `Mascotas totales: ${overview.totalPets}`,
          `Cumpliendo meta: ${overview.petsOnTrack}`,
          `Alertas activas: ${overview.alerts}`,
          `Promedio semanal: ${overview.avgWeeklyAchievement}%`,
        ],
      },
    ],
    tables: [
      {
        title: "Balance por Mascota",
        columns: [
          { header: "Mascota", dataKey: "petName" },
          { header: "Servido (g)", dataKey: "served" },
          { header: "Comido (g)", dataKey: "eaten" },
          { header: "Meta (g)", dataKey: "goal" },
          { header: "Cumplimiento (%)", dataKey: "percentage" },
          { header: "Estado", dataKey: "status" },
        ],
        data: balances,
      },
    ],
  });
}
