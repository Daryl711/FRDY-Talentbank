import * as XLSX from "xlsx";
import type { HireStage, MatchedCandidate } from "@/lib/types";
import type { Company, Role } from "@/lib/employer";

// All pipeline stages a candidate can be in, in the order they should appear
// on the report (mirrors the Hiring board's STAGE_ORDER plus the two terminal
// states, which aren't board columns but still need reporting).
const REPORT_STAGES: HireStage[] = [
  "Applied", "Screening", "Shortlisted", "Interview", "Final Round", "Offer", "Hired", "Rejected",
];

function pct(count: number, total: number): string {
  return total > 0 ? `${((count / total) * 100).toFixed(1)}%` : "0.0%";
}

/**
 * Builds and downloads a multi-sheet Excel management report for the
 * signed-in employer's hiring pipeline: total applicants, applicants per job,
 * the percentage breakdown of each pipeline stage, and a per-candidate detail
 * sheet. Runs entirely client-side (xlsx writer only — this never parses
 * untrusted files, so the known SheetJS read-path CVEs don't apply here).
 */
export function generateHiringReport(company: Company, roles: Role[], candidates: MatchedCandidate[]): void {
  const total = candidates.length;
  const generatedAt = new Date();

  const hired = candidates.filter((c) => c.stage === "Hired").length;
  const rejected = candidates.filter((c) => c.stage === "Rejected").length;
  const inPipeline = total - hired - rejected;
  const avgScore = total > 0 ? candidates.reduce((s, c) => s + c.score, 0) / total : 0;

  // ---- Summary sheet ---------------------------------------------------
  const summaryRows: (string | number)[][] = [
    ["Hiring Management Report"],
    ["Company", company.name],
    ["Generated", generatedAt.toLocaleString("en-US")],
    [],
    ["Metric", "Value"],
    ["Total Applicants", total],
    ["Open Roles Posted", roles.length],
    ["In Active Pipeline", inPipeline],
    ["Hired", hired],
    ["Hired Rate", pct(hired, total)],
    ["Rejected", rejected],
    ["Rejection Rate", pct(rejected, total)],
    ["Average Match Score", total > 0 ? `${avgScore.toFixed(1)}%` : "—"],
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet["!cols"] = [{ wch: 22 }, { wch: 28 }];

  // ---- By Stage sheet ----------------------------------------------------
  const stageRows: (string | number)[][] = [["Stage", "Applicants", "% of Total"]];
  for (const stage of REPORT_STAGES) {
    const count = candidates.filter((c) => c.stage === stage).length;
    stageRows.push([stage, count, pct(count, total)]);
  }
  stageRows.push(["Total", total, "100.0%"]);
  const stageSheet = XLSX.utils.aoa_to_sheet(stageRows);
  stageSheet["!cols"] = [{ wch: 16 }, { wch: 12 }, { wch: 12 }];

  // ---- By Role sheet -------------------------------------------------
  // Every posted role, plus an "Unspecified" bucket for older matches made
  // before applications were tied to a specific role_id.
  const hasUnspecified = candidates.some((c) => !c.role);
  const roleNames = hasUnspecified ? [...roles.map((r) => r.title), "Unspecified"] : roles.map((r) => r.title);
  const roleRows: (string | number)[][] = [["Role", "Status", "Applicants", "% of Total", "Hired", "Avg Match Score"]];
  for (const name of roleNames) {
    const inRole = name === "Unspecified" ? candidates.filter((c) => !c.role) : candidates.filter((c) => c.role === name);
    const roleHired = inRole.filter((c) => c.stage === "Hired").length;
    const roleAvg = inRole.length > 0 ? inRole.reduce((s, c) => s + c.score, 0) / inRole.length : 0;
    const status = name === "Unspecified" ? "—" : (roles.find((r) => r.title === name)?.status ?? "—");
    roleRows.push([name, status, inRole.length, pct(inRole.length, total), roleHired, inRole.length > 0 ? `${roleAvg.toFixed(1)}%` : "—"]);
  }
  const roleSheet = XLSX.utils.aoa_to_sheet(roleRows);
  roleSheet["!cols"] = [{ wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 16 }];

  // ---- Applicants detail sheet -----------------------------------------
  const detailRows: (string | number)[][] = [["Candidate", "Role", "Stage", "Match Score", "Trait", "Date Applied"]];
  for (const c of candidates) {
    detailRows.push([
      c.name,
      c.role ?? "Unspecified",
      c.stage,
      c.score,
      c.trait ?? "—",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-US") : "—",
    ]);
  }
  const detailSheet = XLSX.utils.aoa_to_sheet(detailRows);
  detailSheet["!cols"] = [{ wch: 22 }, { wch: 26 }, { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
  XLSX.utils.book_append_sheet(wb, stageSheet, "By Stage");
  XLSX.utils.book_append_sheet(wb, roleSheet, "By Role");
  XLSX.utils.book_append_sheet(wb, detailSheet, "Applicants");

  const datePart = generatedAt.toISOString().slice(0, 10);
  const safeName = company.name.trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "company";
  XLSX.writeFile(wb, `${safeName}-hiring-report-${datePart}.xlsx`);
}
