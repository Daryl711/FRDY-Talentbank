import { downloadReport } from "@/lib/reportBuilder";
import type { TraitCandidate, TraitStat, TrajProfile } from "@/lib/types";

/**
 * Builds and downloads a report for the Animal Traits page — shared by the
 * employer and university portals, which both render it off the same
 * lib/mock.ts data.
 */
export function generateTraitsReport(
  traitStats: TraitStat[],
  traitCandidates: TraitCandidate[],
  subjectPlural: string = "candidates",
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["Animal Traits Report"],
    [`Total ${subjectPlural}`, traitCandidates.length],
    ["Generated", generatedAt.toLocaleString("en-US")],
    [],
    ["Trait", "Share", "Count"],
    ...traitStats.map((t) => [t.trait, `${t.pct}%`, t.count]),
  ];

  const listRows: (string | number)[][] = [["Name", "Role", "Trait", "Archetype", "Match Score"]];
  for (const c of traitCandidates) listRows.push([c.name, c.role, c.trait, c.archetype, c.match]);

  downloadReport("animal-traits-report", [
    { name: "Summary", rows: summaryRows, colWidths: [16, 12, 10] },
    { name: subjectPlural === "students" ? "Students" : "Candidates", rows: listRows, colWidths: [22, 26, 12, 20, 12] },
  ]);
}

/**
 * Builds and downloads a report for the Trajectory page — shared by the
 * employer and university portals via components/TrajectoryView.tsx. Only
 * the currently-loaded page of profiles is reported (the view is paginated
 * server-side), which the summary sheet makes explicit.
 */
export function generateTrajectoryReport(
  profiles: TrajProfile[],
  subjectPlural: string,
  page: number,
  totalPages: number,
  total: number,
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["Trajectory Report"],
    [`Total ${subjectPlural} modelled`, total],
    ["Page in this report", `${page + 1} of ${totalPages}`],
    ["Profiles in this report", profiles.length],
    ["Generated", generatedAt.toLocaleString("en-US")],
  ];

  const profileRows: (string | number)[][] = [
    ["Name", "Current Role", "Current Salary", "Confidence", "Target Role", "Target Salary", "Horizon (months)"],
  ];
  for (const p of profiles) {
    profileRows.push([p.name, p.role, p.currentSalary, `${p.confidence}%`, p.targetRole, p.targetSalary, p.horizonMonths]);
  }

  const skillsRows: (string | number)[][] = [["Name", "Skill", "Current", "Required", "Gap"]];
  for (const p of profiles) {
    for (const s of p.skills) skillsRows.push([p.name, s.name, s.current, s.required, s.required - s.current]);
  }

  downloadReport("trajectory-report", [
    { name: "Summary", rows: summaryRows, colWidths: [26, 18] },
    { name: subjectPlural === "students" ? "Students" : "Candidates", rows: profileRows, colWidths: [20, 24, 14, 12, 24, 14, 16] },
    { name: "Skills Gap", rows: skillsRows, colWidths: [20, 20, 10, 10, 8] },
  ]);
}
