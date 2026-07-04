import { Applicant, MonthPoint, PipelineStage, StatCard } from "./types";

export const orgName = "Meridian Capital";
export const periodLabel = "Hiring overview for June 2026";

export const stats: StatCard[] = [
  { label: "Active Job Posts", value: "14", delta: "+3 this month", deltaTone: "up", icon: "briefcase" },
  { label: "Total Applications", value: "2,841", delta: "+510 this month", deltaTone: "up", icon: "users" },
  { label: "Hiring Rate", value: "7.4%", delta: "+1.2% vs last month", deltaTone: "up", icon: "trending" },
  { label: "Avg. Time to Hire", value: "18d", delta: "-3d vs last quarter", deltaTone: "down", icon: "clock" },
];

// 6-month rolling: applications (gold) climbing with a dip in Mar, hired (green) flat-low.
export const trend: MonthPoint[] = [
  { month: "Jan", applications: 295, hired: 18 },
  { month: "Feb", applications: 330, hired: 22 },
  { month: "Mar", applications: 305, hired: 20 },
  { month: "Apr", applications: 410, hired: 28 },
  { month: "May", applications: 395, hired: 31 },
  { month: "Jun", applications: 520, hired: 38 },
];

export const pipeline: PipelineStage[] = [
  { stage: "Applied", count: 1240 },
  { stage: "Screening", count: 380 },
  { stage: "Interview", count: 142 },
  { stage: "Offer", count: 48 },
  { stage: "Hired", count: 38 },
];

export const applicants: Applicant[] = [
  { id: "a1", name: "Victoria Harmon", initials: "VH", role: "Senior PM", trait: "Lion", match: 94, stage: "Interview" },
  { id: "a2", name: "James Whitfield", initials: "JW", role: "VP Engineering", trait: "Owl", match: 88, stage: "Screening" },
  { id: "a3", name: "Sophia Laurent", initials: "SL", role: "Director Strategy", trait: "Eagle", match: 91, stage: "Offer" },
  { id: "a4", name: "Marcus Chen", initials: "MC", role: "Head of Finance", trait: "Bear", match: 82, stage: "Applied" },
  { id: "a5", name: "Eleanor Voss", initials: "EV", role: "Chief of Staff", trait: "Dolphin", match: 87, stage: "Interview" },
];

export const traitEmoji: Record<string, string> = {
  Lion: "🦁",
  Owl: "🦉",
  Eagle: "🦅",
  Bear: "🐻",
  Dolphin: "🐬",
};
