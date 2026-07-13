// University portal mock data. Reuses the shared trait/trajectory data from
// lib/mock.ts; adds university-specific series (employability, course prefs).

export const uniName = "Nexus University";

// ---- Dashboard ------------------------------------------------------------
export const uniStats = [
  { label: "Overall Employability", value: "86%", delta: "+3% vs 2025", deltaTone: "up" as const, icon: "trending" },
  { label: "Graduates (2026)", value: "3,840", delta: "+210 vs last year", deltaTone: "up" as const, icon: "briefcase" },
  { label: "Avg. Time to Employment", value: "4.2mo", delta: "-0.6mo improvement", deltaTone: "down" as const, icon: "clock" },
  { label: "Active Students", value: "12,400", delta: "+480 enrolled", deltaTone: "up" as const, icon: "users" },
];

export const employabilityTrend = [
  { year: "2021", rate: 71 },
  { year: "2022", rate: 74 },
  { year: "2023", rate: 78 },
  { year: "2024", rate: 81 },
  { year: "2025", rate: 83 },
  { year: "2026", rate: 86 },
];

export const industryLanding = [
  { name: "Technology", pct: 38, color: "#5b8fd6" },
  { name: "Finance & Banking", pct: 22, color: "#d8b45a" },
  { name: "Consulting", pct: 14, color: "#a78bfa" },
  { name: "Healthcare", pct: 11, color: "#3fbf6a" },
  { name: "Other", pct: 15, color: "#9aa3b8" },
];

export interface CourseRow {
  course: string;
  graduates: number;
  employed: number;
  salary: string;
  yoy: number;
}

export const courseOverview: CourseRow[] = [
  { course: "Computer Science", graduates: 420, employed: 94, salary: "$112K", yoy: 3 },
  { course: "Business Administration", graduates: 680, employed: 88, salary: "$85K", yoy: 1 },
  { course: "Data Science", graduates: 210, employed: 96, salary: "$128K", yoy: 5 },
  { course: "Finance", graduates: 310, employed: 91, salary: "$98K", yoy: 2 },
  { course: "Psychology", graduates: 280, employed: 72, salary: "$58K", yoy: -1 },
];

// ---- Employability page ---------------------------------------------------
export const employabilityOverall = 84;

export interface CourseEmployability {
  id: string;
  course: string;
  faculty: string;
  facultyCode: string;
  rate: number;
  graduates: number;
  salary: string;
  avgTime: string;
  yoy: number;
  trend: { year: string; rate: number }[];
}

export const courseEmployability: CourseEmployability[] = [
  { id: "e1", course: "Data Science", faculty: "Computing", facultyCode: "COMP", rate: 96, graduates: 210, salary: "$128K", avgTime: "2.1mo", yoy: 5,
    trend: [{ year: "2021", rate: 79 }, { year: "2022", rate: 83 }, { year: "2023", rate: 87 }, { year: "2024", rate: 90 }, { year: "2025", rate: 93 }, { year: "2026", rate: 96 }] },
  { id: "e2", course: "Computer Science", faculty: "Computing", facultyCode: "COMP", rate: 94, graduates: 420, salary: "$112K", avgTime: "2.4mo", yoy: 3,
    trend: [{ year: "2021", rate: 82 }, { year: "2022", rate: 85 }, { year: "2023", rate: 88 }, { year: "2024", rate: 90 }, { year: "2025", rate: 92 }, { year: "2026", rate: 94 }] },
  { id: "e3", course: "Finance", faculty: "Business", facultyCode: "BUSI", rate: 91, graduates: 310, salary: "$98K", avgTime: "3.0mo", yoy: 2,
    trend: [{ year: "2021", rate: 80 }, { year: "2022", rate: 83 }, { year: "2023", rate: 85 }, { year: "2024", rate: 87 }, { year: "2025", rate: 89 }, { year: "2026", rate: 91 }] },
  { id: "e4", course: "Business Administration", faculty: "Business", facultyCode: "BUSI", rate: 88, graduates: 680, salary: "$85K", avgTime: "3.4mo", yoy: 1,
    trend: [{ year: "2021", rate: 79 }, { year: "2022", rate: 81 }, { year: "2023", rate: 83 }, { year: "2024", rate: 85 }, { year: "2025", rate: 87 }, { year: "2026", rate: 88 }] },
  { id: "e5", course: "Electrical Engineering", faculty: "Engineering", facultyCode: "ENGI", rate: 87, graduates: 190, salary: "$104K", avgTime: "3.1mo", yoy: 2,
    trend: [{ year: "2021", rate: 76 }, { year: "2022", rate: 79 }, { year: "2023", rate: 82 }, { year: "2024", rate: 84 }, { year: "2025", rate: 86 }, { year: "2026", rate: 87 }] },
  { id: "e6", course: "Mechanical Engineering", faculty: "Engineering", facultyCode: "ENGI", rate: 85, graduates: 220, salary: "$96K", avgTime: "3.5mo", yoy: 1,
    trend: [{ year: "2021", rate: 75 }, { year: "2022", rate: 78 }, { year: "2023", rate: 80 }, { year: "2024", rate: 82 }, { year: "2025", rate: 84 }, { year: "2026", rate: 85 }] },
];

export const facultyFilters = ["ALL", "COMP", "BUSI", "ENGI", "SOCI", "HUMA"];

export const rateByCourse = [
  { course: "Computer Science", rate: 94 },
  { course: "Business Administration", rate: 88 },
  { course: "Mechanical Engineering", rate: 85 },
  { course: "Economics", rate: 79 },
  { course: "Liberal Arts", rate: 68 },
];

// ---- Course Preferences page ----------------------------------------------
export const prefStats = [
  { label: "Total Searches (7d)", value: "28,160", sub: "+19%", tone: "info" as const },
  { label: "Trending Category", value: "Tech", sub: "+38% avg", tone: "info" as const },
  { label: "Top Search Term", value: "Data Science", sub: "4,820 searches", tone: "gold" as const },
  { label: "Unique Students", value: "7,840", sub: "of 12,400", tone: "info" as const },
];

export const searchVolume = [
  { week: "Wk 1", tech: 1650, finance: 820, consulting: 640 },
  { week: "Wk 2", tech: 1980, finance: 900, consulting: 700 },
  { week: "Wk 3", tech: 2180, finance: 980, consulting: 760 },
  { week: "Wk 4", tech: 2100, finance: 1020, consulting: 790 },
  { week: "Wk 5", tech: 2600, finance: 1160, consulting: 800 },
  { week: "Wk 6", tech: 3080, finance: 1280, consulting: 820 },
];

export const interestScore = [
  { course: "Data Science", score: 92 },
  { course: "Computer Science", score: 88 },
  { course: "Artificial Intelligence", score: 86 },
  { course: "Finance", score: 70 },
  { course: "Business Admin", score: 66 },
  { course: "Psychology", score: 52 },
  { course: "Liberal Arts", score: 38 },
];

export interface SearchTerm {
  rank: number;
  category: string;
  categoryColor: string;
  term: string;
  count: string;
  delta: number;
}

export const searchTerms: SearchTerm[] = [
  { rank: 1, category: "Tech", categoryColor: "#5b8fd6", term: "Data Science jobs", count: "4,820", delta: 38 },
  { rank: 2, category: "Tech", categoryColor: "#5b8fd6", term: "Software Engineer salary", count: "3,910", delta: 24 },
  { rank: 3, category: "Product", categoryColor: "#3fbf6a", term: "Product Manager career path", count: "3,410", delta: 31 },
  { rank: 4, category: "Finance", categoryColor: "#d8b45a", term: "Investment Banking analyst", count: "2,980", delta: 18 },
  { rank: 5, category: "Tech", categoryColor: "#5b8fd6", term: "Machine learning engineer", count: "2,750", delta: 52 },
  { rank: 6, category: "Consulting", categoryColor: "#a78bfa", term: "Consulting internship", count: "2,340", delta: 14 },
  { rank: 7, category: "Design", categoryColor: "#e0894a", term: "UX designer portfolio", count: "2,100", delta: 9 },
  { rank: 8, category: "Finance", categoryColor: "#d8b45a", term: "Actuarial science roles", count: "1,840", delta: 6 },
  { rank: 9, category: "General", categoryColor: "#9aa3b8", term: "Remote jobs 2026", count: "1,790", delta: 27 },
  { rank: 10, category: "General", categoryColor: "#9aa3b8", term: "Startup equity explained", count: "1,420", delta: 43 },
];
