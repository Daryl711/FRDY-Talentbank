import type { HireStage, MatchedCandidate } from "@/lib/types";
import type { Company, Role } from "@/lib/employer";
import type { Applicant, PipelineStage, StatCard } from "@/lib/types";
import { downloadReport, pct } from "@/lib/reportBuilder";

// All pipeline stages a candidate can be in, in the order they should appear
// on the report (mirrors the Hiring board's STAGE_ORDER plus the two terminal
// states, which aren't board columns but still need reporting).
const REPORT_STAGES: HireStage[] = [
  "Applied", "Screening", "Shortlisted", "Interview", "Final Round", "Offer", "Hired", "Rejected",
];

/**
 * Builds and downloads a multi-sheet Excel management report for the
 * signed-in employer's hiring pipeline: total applicants, applicants per job,
 * the percentage breakdown of each pipeline stage, and a per-candidate detail
 * sheet.
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

  // ---- By Stage sheet ----------------------------------------------------
  const stageRows: (string | number)[][] = [["Stage", "Applicants", "% of Total"]];
  for (const stage of REPORT_STAGES) {
    const count = candidates.filter((c) => c.stage === stage).length;
    stageRows.push([stage, count, pct(count, total)]);
  }
  stageRows.push(["Total", total, "100.0%"]);

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

  downloadReport(`${company.name}-hiring-report`, [
    { name: "Summary", rows: summaryRows, colWidths: [22, 28] },
    { name: "By Stage", rows: stageRows, colWidths: [16, 12, 12] },
    { name: "By Role", rows: roleRows, colWidths: [28, 10, 12, 12, 8, 16] },
    { name: "Applicants", rows: detailRows, colWidths: [22, 26, 14, 12, 12, 14] },
  ]);
}

/** Builds and downloads a report for the employer Dashboard page. */
export function generateEmployerDashboardReport(
  stats: StatCard[],
  pipeline: PipelineStage[],
  applicants: Applicant[],
  periodLabel: string,
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["Employer Dashboard Report"],
    ["Period", periodLabel],
    ["Generated", generatedAt.toLocaleString("en-US")],
    [],
    ["Metric", "Value", "Change"],
    ...stats.map((s) => [s.label, s.value, s.delta]),
  ];

  const pipelineRows: (string | number)[][] = [["Stage", "Candidates"]];
  for (const p of pipeline) pipelineRows.push([p.stage, p.count]);

  const applicantRows: (string | number)[][] = [["Candidate", "Role", "Trait", "Match Score", "Stage"]];
  for (const a of applicants) applicantRows.push([a.name, a.role, a.trait, a.match, a.stage]);

  downloadReport("employer-dashboard-report", [
    { name: "Summary", rows: summaryRows, colWidths: [20, 24, 16] },
    { name: "Pipeline", rows: pipelineRows, colWidths: [18, 14] },
    { name: "Recent Applicants", rows: applicantRows, colWidths: [22, 26, 12, 12, 14] },
  ]);
}

/** Builds and downloads a report for the employer Hiring Rate page. */
export function generateHiringRateReport(
  overallRate: string,
  bestDepartment: string,
  avgTimeToHire: string,
  trend: { month: string; rate: number }[],
  byDepartment: { dept: string; rate: number }[],
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["Hiring Rate Report"],
    ["Generated", generatedAt.toLocaleString("en-US")],
    [],
    ["Metric", "Value"],
    ["Overall Hiring Rate", overallRate],
    ["Best Department", bestDepartment],
    ["Avg. Time to Hire", avgTimeToHire],
  ];

  const trendRows: (string | number)[][] = [["Month", "Rate (%)"]];
  for (const t of trend) trendRows.push([t.month, t.rate]);

  const deptRows: (string | number)[][] = [["Department", "Rate (%)"]];
  for (const d of byDepartment) deptRows.push([d.dept, d.rate]);

  downloadReport("hiring-rate-report", [
    { name: "Summary", rows: summaryRows, colWidths: [20, 22] },
    { name: "Trend", rows: trendRows, colWidths: [12, 12] },
    { name: "By Department", rows: deptRows, colWidths: [16, 12] },
  ]);
}
