import * as XLSX from "xlsx";

export interface ReportSheet {
  name: string;
  rows: (string | number)[][];
  /** Column widths (characters), applied in order. */
  colWidths?: number[];
}

/**
 * Builds and downloads a multi-sheet Excel file client-side. Shared by every
 * "Generate Report" button across the employer/university portals — see
 * lib/employerReport.ts, lib/universityReport.ts, and lib/sharedReport.ts for
 * the per-page sheet content. Runs entirely client-side (xlsx writer only —
 * this never parses untrusted files, so the known SheetJS read-path CVEs
 * don't apply here).
 */
export function downloadReport(filenameBase: string, sheets: ReportSheet[]): void {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    if (sheet.colWidths) ws["!cols"] = sheet.colWidths.map((wch) => ({ wch }));
    // Excel sheet names are capped at 31 characters.
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  }
  const datePart = new Date().toISOString().slice(0, 10);
  const safeName = filenameBase.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "report";
  XLSX.writeFile(wb, `${safeName}-${datePart}.xlsx`);
}

export function pct(count: number, total: number): string {
  return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0.0%";
}
