import { downloadReport } from "@/lib/reportBuilder";
import type { CourseEmployability, CourseRow, SearchTerm } from "@/lib/university";

/** Builds and downloads a report for the University Dashboard page. */
export function generateUniversityDashboardReport(
  uniName: string,
  uniStats: { label: string; value: string; delta: string }[],
  industryLanding: { name: string; pct: number }[],
  courseOverview: CourseRow[],
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["University Dashboard Report"],
    ["University", uniName],
    ["Generated", generatedAt.toLocaleString("en-US")],
    [],
    ["Metric", "Value", "Change"],
    ...uniStats.map((s) => [s.label, s.value, s.delta]),
  ];

  const industryRows: (string | number)[][] = [["Industry", "% of Graduates"]];
  for (const i of industryLanding) industryRows.push([i.name, `${i.pct}%`]);

  const courseRows: (string | number)[][] = [["Course", "Graduates", "Employed %", "Avg. Starting Salary", "YoY"]];
  for (const c of courseOverview) courseRows.push([c.course, c.graduates, `${c.employed}%`, c.salary, `${c.yoy >= 0 ? "+" : ""}${c.yoy}%`]);

  downloadReport("university-dashboard-report", [
    { name: "Summary", rows: summaryRows, colWidths: [24, 24, 16] },
    { name: "Industry Landing", rows: industryRows, colWidths: [22, 16] },
    { name: "Course Overview", rows: courseRows, colWidths: [26, 12, 12, 20, 10] },
  ]);
}

/** Builds and downloads a report for the University Employability page. */
export function generateEmployabilityReport(
  employabilityOverall: number,
  courseEmployability: CourseEmployability[],
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["Employability Report"],
    ["Overall Employability Rate", `${employabilityOverall}%`],
    ["Courses Tracked", courseEmployability.length],
    ["Generated", generatedAt.toLocaleString("en-US")],
  ];

  const courseRows: (string | number)[][] = [
    ["Course", "Faculty", "Rate", "Graduates", "Avg. Salary", "Avg. Time to Employment", "YoY"],
  ];
  for (const c of courseEmployability) {
    courseRows.push([c.course, c.faculty, `${c.rate}%`, c.graduates, c.salary, c.avgTime, `${c.yoy >= 0 ? "+" : ""}${c.yoy}%`]);
  }

  downloadReport("employability-report", [
    { name: "Summary", rows: summaryRows, colWidths: [26, 18] },
    { name: "Courses", rows: courseRows, colWidths: [26, 16, 10, 12, 14, 20, 8] },
  ]);
}

/** Builds and downloads a report for the University Course Preferences page. */
export function generatePreferencesReport(
  prefStats: { label: string; value: string; sub: string }[],
  searchTerms: SearchTerm[],
): void {
  const generatedAt = new Date();

  const summaryRows: (string | number)[][] = [
    ["Course Preferences Report"],
    ["Generated", generatedAt.toLocaleString("en-US")],
    [],
    ["Metric", "Value", "Detail"],
    ...prefStats.map((s) => [s.label, s.value, s.sub]),
  ];

  const termRows: (string | number)[][] = [["Rank", "Category", "Search Term", "Count", "Change"]];
  for (const t of searchTerms) termRows.push([t.rank, t.category, t.term, t.count, `+${t.delta}%`]);

  downloadReport("course-preferences-report", [
    { name: "Summary", rows: summaryRows, colWidths: [22, 16, 30] },
    { name: "Search Terms", rows: termRows, colWidths: [8, 14, 30, 12, 10] },
  ]);
}
