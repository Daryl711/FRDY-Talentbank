import { Applicant, MonthPoint, PipelineStage, StatCard, TraitCandidate, TraitStat, TrajProfile, JobRole} from "./types";

export const orgName = "CelcomDigi";
export const orgInitials = "CD";
export const periodLabel = "CelcomDigi hiring overview · June 2026";

// The signed-in employer (hiring) user who manages CelcomDigi's pipeline.
export const hiringUser = {
  name: "Aisyah Rahman",
  role: "Talent Acquisition Lead",
  initials: "AR",
};

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

// Trajectory page
export const trajModelVersion = "v3.1";
export const trajStats = [
  { label: "Model Accuracy", value: "91.4%", icon: "target" as const },
  { label: "Avg. Confidence", value: "87%", icon: "zap" as const },
  { label: "Paths Modelled", value: "2,841", icon: "trending" as const },
  { label: "Correct Predictions", value: "1,820", icon: "arrow" as const },
];

export const trajProfiles: TrajProfile[] = [
  {
    id: "t1", name: "Victoria Harmon", initials: "VH", trait: "Lion", role: "Senior PM",
    currentSalary: "$145K", arrowTarget: "Product", score: 92,
    targetRole: "VP of Product", targetSalary: "$210K", confidence: 92, horizonMonths: 18,
    trajectory: [
      { label: "Now", value: 78 }, { label: "6mo", value: 82 }, { label: "12mo", value: 86 },
      { label: "18mo", value: 91 }, { label: "24mo", value: 95 },
    ],
    nextRoles: [
      { role: "VP of Product", context: "Series B–D SaaS", pct: 92 },
      { role: "Director of Product", context: "Enterprise Tech", pct: 85 },
      { role: "Chief Product Officer", context: "Startup (2yr+)", pct: 41 },
    ],
    skills: [
      { name: "Executive Presence", current: 72, required: 90 },
      { name: "P&L Management", current: 65, required: 85 },
      { name: "Board Communication", current: 55, required: 80 },
      { name: "Team Scaling", current: 80, required: 88 },
    ],
  },
  {
    id: "t2", name: "James Whitfield", initials: "JW", trait: "Owl", role: "VP Engineering",
    currentSalary: "$185K", arrowTarget: "CTO", score: 87,
    targetRole: "Chief Technology Officer", targetSalary: "$260K", confidence: 87, horizonMonths: 24,
    trajectory: [
      { label: "Now", value: 82 }, { label: "6mo", value: 84 }, { label: "12mo", value: 87 },
      { label: "18mo", value: 90 }, { label: "24mo", value: 93 },
    ],
    nextRoles: [
      { role: "Chief Technology Officer", context: "Series C SaaS", pct: 87 },
      { role: "VP of Platform", context: "Enterprise Tech", pct: 79 },
      { role: "Technical Co-founder", context: "Startup", pct: 38 },
    ],
    skills: [
      { name: "Org Design", current: 68, required: 88 },
      { name: "Budget Ownership", current: 60, required: 82 },
      { name: "Executive Comms", current: 64, required: 85 },
      { name: "Vision Setting", current: 78, required: 90 },
    ],
  },
  {
    id: "t3", name: "Sophia Laurent", initials: "SL", trait: "Eagle", role: "Director Strategy",
    currentSalary: "$160K", arrowTarget: "Officer", score: 84,
    targetRole: "Chief Strategy Officer", targetSalary: "$240K", confidence: 84, horizonMonths: 24,
    trajectory: [
      { label: "Now", value: 76 }, { label: "6mo", value: 80 }, { label: "12mo", value: 84 },
      { label: "18mo", value: 88 }, { label: "24mo", value: 92 },
    ],
    nextRoles: [
      { role: "Chief Strategy Officer", context: "Growth-stage", pct: 84 },
      { role: "VP Corporate Development", context: "Enterprise", pct: 80 },
      { role: "General Manager", context: "Business Unit", pct: 45 },
    ],
    skills: [
      { name: "P&L Ownership", current: 66, required: 88 },
      { name: "Executive Presence", current: 74, required: 90 },
      { name: "Capital Allocation", current: 58, required: 82 },
      { name: "Stakeholder Mgmt", current: 82, required: 88 },
    ],
  },
];

// Hiring Page
export const jobRoles: JobRole[] = [
  {
    id: "j-celcomdigi", title: "Senior Product Manager, Digital", dept: "Product", status: "Active",
    applicants: 132, daysOpen: 6, location: "Kuala Lumpur, MY", type: "Hybrid",
    pipeline: [
      { stage: "Applied", candidates: [
        { name: "Aiman Zulkifli", trait: "Fox", match: 88 },
        { name: "Mei Ling Tan", trait: "Owl", match: 84 },
      ] },
      { stage: "Screening", candidates: [{ name: "Rajesh Kumar", trait: "Eagle", match: 91 }] },
      { stage: "Interview", candidates: [{ name: "Nurul Huda", trait: "Dolphin", match: 90 }] },
      { stage: "Final Round", candidates: [{ name: "Wei Jie Lim", trait: "Lion", match: 93 }] },
      { stage: "Offer", candidates: [] },
    ],
  },
  {
    id: "j1", title: "Senior Product Manager", dept: "Product", status: "Active",
    applicants: 214, daysOpen: 8, location: "New York, NY", type: "Full-time",
    pipeline: [
      { stage: "Applied", candidates: [{ name: "Nathan Blake", trait: "Lion", match: 85 }] },
      { stage: "Screening", candidates: [{ name: "Eleanor Voss", trait: "Dolphin", match: 87 }] },
      { stage: "Interview", candidates: [{ name: "Victoria Harmon", trait: "Lion", match: 94 }] },
      { stage: "Final Round", candidates: [{ name: "Isabelle Fontaine", trait: "Eagle", match: 93 }] },
      { stage: "Offer", candidates: [{ name: "Robert Sterling", trait: "Owl", match: 89 }] },
    ],
  },
  {
    id: "j2", title: "VP of Engineering", dept: "Engineering", status: "Active",
    applicants: 98, daysOpen: 14, location: "San Francisco, CA", type: "Full-time",
    pipeline: [
      { stage: "Applied", candidates: [{ name: "Derek Alvarez", trait: "Octopus", match: 81 }] },
      { stage: "Screening", candidates: [{ name: "James Whitfield", trait: "Owl", match: 88 }] },
      { stage: "Interview", candidates: [{ name: "Priya Nair", trait: "Fox", match: 90 }] },
      { stage: "Final Round", candidates: [] },
      { stage: "Offer", candidates: [] },
    ],
  },
  {
    id: "j3", title: "Chief of Staff", dept: "Executive", status: "Active",
    applicants: 177, daysOpen: 5, location: "New York, NY", type: "Full-time",
    pipeline: [
      { stage: "Applied", candidates: [{ name: "Eleanor Voss", trait: "Dolphin", match: 87 }] },
      { stage: "Screening", candidates: [{ name: "Grace Bennett", trait: "Horse", match: 79 }] },
      { stage: "Interview", candidates: [] },
      { stage: "Final Round", candidates: [] },
      { stage: "Offer", candidates: [] },
    ],
  },
  {
    id: "j4", title: "Director of Finance", dept: "Finance", status: "Active",
    applicants: 143, daysOpen: 21, location: "Chicago, IL", type: "Full-time",
    pipeline: [
      { stage: "Applied", candidates: [{ name: "Marcus Chen", trait: "Bear", match: 82 }] },
      { stage: "Screening", candidates: [] },
      { stage: "Interview", candidates: [{ name: "Lena Ortiz", trait: "Ant", match: 84 }] },
      { stage: "Final Round", candidates: [] },
      { stage: "Offer", candidates: [] },
    ],
  },
  {
    id: "j5", title: "Head of Marketing", dept: "Marketing", status: "Draft",
    applicants: 89, daysOpen: 3, location: "Remote", type: "Full-time",
    pipeline: [
      { stage: "Applied", candidates: [{ name: "Chloe Rivera", trait: "Peacock", match: 86 }] },
      { stage: "Screening", candidates: [] },
      { stage: "Interview", candidates: [] },
      { stage: "Final Round", candidates: [] },
      { stage: "Offer", candidates: [] },
    ],
  },
];

// Hiring Rate page
export const hiringRateByDept = [
  { dept: "Product", rate: 8.2 },
  { dept: "Engineering", rate: 6.1 },
  { dept: "Finance", rate: 9.4 },
  { dept: "Executive", rate: 4.7 },
  { dept: "Marketing", rate: 7.8 },
];

export const hiringRateTrend = [
  { month: "Jan", rate: 5.8 },
  { month: "Feb", rate: 6.2 },
  { month: "Mar", rate: 6.0 },
  { month: "Apr", rate: 6.9 },
  { month: "May", rate: 7.1 },
  { month: "Jun", rate: 7.4 },
];
