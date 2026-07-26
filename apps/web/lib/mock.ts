import { Applicant, AnimalTrait, MonthPoint, NextRole, PipelineStage, SkillGap, StatCard, TraitCandidate, TraitStat, TrajPoint, TrajProfile, JobRole} from "./types";

export const orgName = "CelcomDigi";
export const orgInitials = "CD";
export const periodLabel = "CelcomDigi hiring overview · June 2026";

// The signed-in employer (hiring) user who manages CelcomDigi's pipeline.
export const hiringUser = {
  name: "Aisyah Rahman",
  role: "Talent Acquisition Lead",
  initials: "A",
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
  { id: "a1", name: "Victoria Harmon", initials: "V", role: "Senior PM", trait: "Lion", match: 94, stage: "Interview" },
  { id: "a2", name: "James Whitfield", initials: "J", role: "VP Engineering", trait: "Owl", match: 88, stage: "Screening" },
  { id: "a3", name: "Sophia Laurent", initials: "S", role: "Director Strategy", trait: "Eagle", match: 91, stage: "Offer" },
  { id: "a4", name: "Marcus Chen", initials: "M", role: "Head of Finance", trait: "Bear", match: 82, stage: "Applied" },
  { id: "a5", name: "Eleanor Voss", initials: "E", role: "Chief of Staff", trait: "Dolphin", match: 87, stage: "Interview" },
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
    id: "c1", name: "Victoria Harmon", initials: "V", role: "Sr. PM", trait: "Lion", match: 94,
    archetype: "Lion Archetype",
    tags: ["Leadership", "Decisiveness", "Drive", "Confidence", "Risk Appetite"],
    radar: radar([92, 70, 82, 62, 68]),
  },
  {
    id: "c2", name: "James Whitfield", initials: "J", role: "VP Engineering", trait: "Owl", match: 88,
    archetype: "Owl Archetype",
    tags: ["Analysis", "Precision", "Expertise", "Focus", "Depth"],
    radar: radar([64, 94, 78, 80, 52]),
  },
  {
    id: "c3", name: "Sophia Laurent", initials: "S", role: "Director Strategy", trait: "Eagle", match: 91,
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

// Deterministic pseudo-random in [0, 1), seeded by a plain number — used
// instead of Math.random() so trajProfiles renders identically on every
// evaluation (server and client). A module-scope array built with real
// randomness would produce a different 500 entries per SSR pass than per
// client hydration, and React would flag a hydration mismatch.
function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Sizes are coprime primes (31, 29): indexing each pool by `i % size` means the
// (first, last) pair only fully repeats every 31*29 = 899 candidates, so all
// 500 generated names stay distinct instead of cycling every 30.
const TRAJ_FIRST_NAMES = ["James","Sophia","Marcus","Eleanor","Victoria","Daniel","Priya","Wei","Aisha","Lucas","Mei","Arjun","Isabella","Ethan","Nadia","Omar","Grace","Ravi","Chloe","Hassan","Amara","Felix","Yuki","Zoe","Kai","Layla","Noah","Mira","Diego","Ingrid","Sara"];
const TRAJ_LAST_NAMES = ["Harmon","Whitfield","Laurent","Chen","Voss","Rahman","Patel","Zhang","Osei","Reyes","Tanaka","Sharma","Novak","Kim","Haddad","Silva","Ibrahim","Nakamura","Fischer","Adeyemi","Larsson","Petrov","Nguyen","Costa","Abara","Lindqvist","Suzuki","Okafor","Moreau"];
const TRAJ_CONTEXTS = ["Series B–D SaaS","Enterprise Tech","Growth-stage","Startup (2yr+)","Public Company","Scale-up","MNC"];
const TRAJ_TRAITS: AnimalTrait[] = ["Lion","Eagle","Wolf","Owl","Octopus","Elephant","Cheetah","Fox","Ant","Horse","Dolphin","Peacock"];
// One ladder + skill pool per career family (Product, Engineering, Design,
// Data, Marketing, Sales, Finance, Operations, HR, Strategy) — mirrors the
// families used by the real seed generator (supabase/seed_demo_data.sql), so
// demo mode and a real database produce comparable-looking trajectories.
const TRAJ_LADDERS: string[][] = [
  ["Associate Product Manager","Product Manager","Senior Product Manager","Director of Product","VP of Product"],
  ["Software Engineer","Senior Software Engineer","Staff Software Engineer","Engineering Manager","VP of Engineering"],
  ["Junior Designer","Product Designer","Senior Product Designer","Design Lead","Head of Design"],
  ["Data Analyst","Data Scientist","Senior Data Scientist","Data Science Manager","Head of Data"],
  ["Marketing Coordinator","Marketing Manager","Senior Marketing Manager","Director of Marketing","VP of Marketing"],
  ["Sales Development Rep","Account Executive","Senior Account Executive","Sales Manager","VP of Sales"],
  ["Financial Analyst","Finance Manager","Senior Finance Manager","Director of Finance","VP of Finance"],
  ["Operations Coordinator","Operations Manager","Senior Operations Manager","Director of Operations","VP of Operations"],
  ["HR Coordinator","HR Business Partner","Senior HRBP","Director of HR","VP of People"],
  ["Strategy Analyst","Strategy Manager","Senior Strategy Manager","Director of Strategy","Chief Strategy Officer"],
];
const TRAJ_SKILL_POOLS: string[][] = [
  ["Roadmapping","User Research","Prioritization","Stakeholder Mgmt","Executive Presence","P&L Management"],
  ["Coding","System Design","Code Review","Architecture","Team Scaling","Org Design"],
  ["Wireframing","Prototyping","Design Systems","User Testing","Design Leadership","Cross-team Influence"],
  ["SQL","Statistics","Experimentation","ML Modeling","Data Strategy","Team Leadership"],
  ["Copywriting","Campaign Mgmt","SEO/SEM","Brand Strategy","Budget Ownership","Executive Comms"],
  ["Prospecting","Negotiation","Account Mgmt","Territory Planning","Sales Strategy","Team Leadership"],
  ["Financial Modeling","Budgeting","Forecasting","Reporting","Capital Allocation","Board Communication"],
  ["Process Design","Vendor Mgmt","Logistics","Resource Planning","Change Management","Executive Presence"],
  ["Recruiting","Onboarding","Employee Relations","Comp & Benefits","Org Design","Culture Leadership"],
  ["Market Analysis","Competitive Intel","Business Cases","Corp Development","Capital Allocation","Board Communication"],
];

function buildTrajProfiles(count: number): TrajProfile[] {
  const profiles: TrajProfile[] = [];
  for (let i = 1; i <= count; i++) {
    const fam = i % 10;
    const ladder = TRAJ_LADDERS[fam];
    const skillPool = TRAJ_SKILL_POOLS[fam];

    const lvl = Math.min(3, Math.floor(seeded(i * 7.13) * seeded(i * 13.7) * 4));
    const headline = ladder[lvl];
    const targetRole = ladder[lvl + 1];
    const trait = TRAJ_TRAITS[i % 12];
    const name = `${TRAJ_FIRST_NAMES[(i - 1) % 31]} ${TRAJ_LAST_NAMES[(i - 1) % 29]}`;
    const initials = name.charAt(0).toUpperCase();

    const confidence = Math.min(97, 58 + lvl * 9 + Math.floor(seeded(i * 9.9) * 12));
    const horizonMonths = [24, 20, 16, 12][lvl];

    const currentSalaryNum = 45000 + lvl * 35000 + Math.floor(seeded(i * 2.2) * 15000);
    const targetSalaryNum = currentSalaryNum + 25000 + lvl * 15000 + Math.floor(seeded(i * 4.4) * 20000);

    const skills: SkillGap[] = [];
    const gapStart = Math.min(2, lvl);
    for (let k = gapStart; k < gapStart + 4 && k < 6; k++) {
      skills.push({
        name: skillPool[k],
        current: Math.max(30, 50 + lvl * 6 - (k + 1) * 4 + Math.floor(seeded(i * (k + 1) * 1.7) * 10)),
        required: Math.min(98, 65 + lvl * 6 + (k + 1) * 3 + Math.floor(seeded(i * (k + 1) * 2.3) * 10)),
      });
    }

    const base = Math.max(50, confidence - 20 - lvl * 3);
    const step = Math.max(1, Math.floor((confidence - base) / 4));
    const trajectory: TrajPoint[] = [
      { label: "Now", value: base },
      { label: "6mo", value: Math.min(99, base + step) },
      { label: "12mo", value: Math.min(99, base + step * 2) },
      { label: "18mo", value: Math.min(99, base + step * 3) },
      { label: "24mo", value: Math.min(99, confidence) },
    ];

    const nextRoles: NextRole[] = [
      { role: targetRole, context: TRAJ_CONTEXTS[i % 7], pct: confidence },
      { role: ladder[Math.min(4, lvl + 2)], context: TRAJ_CONTEXTS[(i + 2) % 7], pct: Math.max(30, confidence - 15) },
      { role: ladder[4], context: TRAJ_CONTEXTS[(i + 4) % 7], pct: Math.max(15, confidence - 40) },
    ];

    profiles.push({
      id: `traj_${i}`,
      name,
      initials,
      trait,
      role: headline,
      currentSalary: `$${Math.round(currentSalaryNum / 1000)}K`,
      arrowTarget: targetRole.split(" ").pop() ?? targetRole,
      score: confidence,
      targetRole,
      targetSalary: `$${Math.round(targetSalaryNum / 1000)}K`,
      confidence,
      horizonMonths,
      trajectory,
      nextRoles,
      skills,
    });
  }
  return profiles;
}

export const trajProfiles: TrajProfile[] = buildTrajProfiles(500);

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
      { stage: "Shortlisted", candidates: [] },
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
      { stage: "Shortlisted", candidates: [] },
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
      { stage: "Shortlisted", candidates: [] },
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
      { stage: "Shortlisted", candidates: [] },
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
      { stage: "Shortlisted", candidates: [] },
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
      { stage: "Shortlisted", candidates: [] },
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
