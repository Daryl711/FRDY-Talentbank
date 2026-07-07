import { Applicant, MonthPoint, PipelineStage, StatCard, TraitCandidate, TraitStat} from "./types";

export const orgName = "Meridian Capital";
export const periodLabel = "Hiring overview for June 2026";

// Dashboard 
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
  Eagle: "🦅", 
  Wolf: "🐺", 
  Owl: "🦉", 
  Octopus: "🐙", 
  Elephant: "🐘",
  Cheetah: "🐆", 
  Fox: "🦊", 
  Ant: "🐜", 
  Horse: "🐴", 
  Dolphin: "🐬", 
  Peacock: "🦚",
  Bear: "🐻",
};

// Animal Traits page
export const traitsProfiled = 8;

export const traitStats: TraitStat[] = [
  { trait: "Lion", pct: 22, count: 28, color: "#d8b45a" },
  { trait: "Owl", pct: 27, count: 35, color: "#5b8fd6" },
  { trait: "Eagle", pct: 17, count: 22, color: "#a78bfa" },
  { trait: "Dolphin", pct: 14, count: 18, color: "#3fbf6a" },
  { trait: "Fox", pct: 12, count: 15, color: "#e0894a" },
  { trait: "Bear", pct: 8, count: 10, color: "#9aa3b8" },
]

const RADAR_AXES = ["Leadership", "Analysis", "Strategy", "Stability", "Social"];
function radar(vals: number[]) {
  return RADAR_AXES.map((axis, i) => ({ axis, value: vals[i] }));
}

export const traitCandidates: TraitCandidate[] = [
  {
    id: "c1", name: "Victoria Harmon", initials: "VH", role: "Sr. PM", trait: "Lion", match: 94,
    archetype: "Lion Archetype",
    tags: ["Leadership", "Decisiveness", "Drive", "Confidence", "Risk Appetite"],
    radar: radar([92, 70, 82, 62, 68]),
  },
  {
    id: "c2", name: "James Whitfield", initials: "JW", role: "VP Engineering", trait: "Owl", match: 88,
    archetype: "Owl Archetype",
    tags: ["Analysis", "Precision", "Expertise", "Focus", "Depth"],
    radar: radar([64, 94, 78, 80, 52]),
  },
  {
    id: "c3", name: "Sophia Laurent", initials: "SL", role: "Director Strategy", trait: "Eagle", match: 91,
    archetype: "Eagle Archetype",
    tags: ["Vision", "Strategy", "Innovation", "Foresight", "Independence"],
    radar: radar([78, 76, 95, 58, 66]),
  },
];