import { Connection, Profile, Resume, Role, SubmittedJob, SwipeCompany } from "./types";

export const me: Profile = {
  id: "me",
  name: "Alexander Chen",
  headline: "Senior Product Manager",
  location: "New York, NY",
  years_exp: 8,
  persona: "Fox",
  about:
    "Strategic product leader with 8 years driving B2B SaaS and fintech platforms from concept to scale. Proven record of aligning cross-functional teams around high-impact roadmaps and delivering measurable revenue outcomes.",
  skills: ["Product Strategy", "Roadmapping", "Agile", "Stakeholder Mgmt", "Data Analytics", "OKRs"],
  experience: [
    {
      id: "exp1",
      title: "Senior Product Manager",
      company: "Meridian Capital",
      dates: "2021 — Present",
      description:
        "Lead product strategy for a B2B fintech platform serving 40+ institutional clients. Shipped a self-serve onboarding flow that cut activation time by 60% and drove $4M in incremental ARR.",
    },
    {
      id: "exp2",
      title: "Product Manager",
      company: "Stratos Ventures",
      dates: "2018 — 2021",
      description:
        "Owned the analytics suite from 0→1, partnering with design and engineering to launch dashboards adopted by 12k monthly active users.",
    },
  ],
  initials: "AC",
  profile_score: 94,
  views: 347,
  matches: 28,
  animal_trait: "Fox",
  animal_scores: {
    Fox: 11, Owl: 9, Eagle: 8, Cheetah: 6, Lion: 6, Octopus: 5,
    Ant: 5, Wolf: 4, Dolphin: 4, Elephant: 3, Horse: 3, Peacock: 2,
  },
};

// Candidates only see CelcomDigi roles — these mirror the CelcomDigi openings
// seeded in supabase/schema.sql. Used as the demo fallback when Supabase is off.
export const featuredRoles: Role[] = [
  { id: "r1", company: "CelcomDigi", initials: "CD", title: "AI Engineer", location: "Kuala Lumpur, MY", salary_min: 105000, salary_max: 150000, type: "Hybrid", match: 95, color: "#1573c4", posted: "Just now" },
  { id: "r2", company: "CelcomDigi", initials: "CD", title: "Software Developer", location: "Kuala Lumpur, MY", salary_min: 72000, salary_max: 102000, type: "Hybrid", match: 92, color: "#1573c4", posted: "1 day ago" },
  { id: "r3", company: "CelcomDigi", initials: "CD", title: "Senior Product Manager, Digital", location: "Kuala Lumpur, MY", salary_min: 90000, salary_max: 130000, type: "Hybrid", match: 90, color: "#1573c4", posted: "2 days ago" },
  { id: "r4", company: "CelcomDigi", initials: "CD", title: "Backend Developer", location: "Kuala Lumpur, MY", salary_min: 84000, salary_max: 118000, type: "Hybrid", match: 88, color: "#1573c4", posted: "3 days ago" },
  { id: "r5", company: "CelcomDigi", initials: "CD", title: "Corporate Strategy Manager", location: "Kuala Lumpur, MY", salary_min: 115000, salary_max: 155000, type: "Full-time", match: 84, color: "#1573c4", posted: "4 days ago" },
  { id: "r6", company: "CelcomDigi", initials: "CD", title: "Finance Business Partner", location: "Kuala Lumpur, MY", salary_min: 90000, salary_max: 120000, type: "Hybrid", match: 82, color: "#1573c4", posted: "5 days ago" },
  { id: "r7", company: "CelcomDigi", initials: "CD", title: "Human Resources Manager", location: "Kuala Lumpur, MY", salary_min: 85000, salary_max: 115000, type: "Hybrid", match: 80, color: "#1573c4", posted: "6 days ago" },
];

export const swipeDeck: SwipeCompany[] = [
  {
    id: "c6",
    initials: "CD",
    name: "CelcomDigi",
    role: "Senior Product Manager, Digital",
    location: "Kuala Lumpur, MY",
    employees: "12,000 emp.",
    match: 90,
    tags: ["Product", "Telco", "Digital"],
    package: "$110K",
    perks: ["Medical", "Hybrid", "Bonus"],
  },
];

// Jobs the candidate has applied to (right-swiped). Shown on the "Submitted"
// view. Used as the demo fallback when Supabase isn't configured.
export const submittedJobs: SubmittedJob[] = [
  { id: "c6", initials: "CD", name: "CelcomDigi", role: "AI Engineer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 95, matched: true, stage: "interview", date: "Jul 14, 2026" },
  { id: "c6b", initials: "CD", name: "CelcomDigi", role: "Software Developer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 92, matched: true, stage: "offer", date: "Jul 12, 2026" },
  { id: "c6c", initials: "CD", name: "CelcomDigi", role: "Backend Developer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 88, matched: true, stage: "review", date: "Jul 10, 2026" },
  { id: "c6d", initials: "CD", name: "CelcomDigi", role: "Corporate Strategy Manager", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 84, matched: false, stage: "applied", date: "Jul 08, 2026" },
];

export const connections: Connection[] = [
  { id: "p1", initials: "VH", color: "#7c4dab", name: "Victoria Harmon", role: "Managing Partner · Arcadia Ventures", mutual: "14 mutual connections", online: true, kind: "network", status: "accepted", connection_id: "c1" },
  { id: "p2", initials: "JW", color: "#2f6b4a", name: "James Whitfield", role: "Chief Investment Officer · Meridian", mutual: "8 mutual connections", online: false, kind: "network", status: "accepted", connection_id: "c2" },
  { id: "p3", initials: "SL", color: "#3a6ea5", name: "Sophia Laurent", role: "VP Strategy · Luminary Group", mutual: "22 mutual connections", online: true, kind: "network", status: "accepted", connection_id: "c3" },
  { id: "p4", initials: "MC", color: "#9a6b34", name: "Marcus Chen", role: "Director of Operations · Pinnacle", mutual: "5 mutual connections", online: false, kind: "network", status: "accepted", connection_id: "c4" },
  { id: "p5", initials: "RD", color: "#b8553f", name: "Rachel Donovan", role: "Partner · Crestline Capital", mutual: "Wants to connect · 11 mutual", online: false, kind: "requests", status: "pending", connection_id: "c5", outgoing: false },
  { id: "p6", initials: "TK", color: "#4a6d8c", name: "Thomas Krause", role: "Head of Talent · Vertex Group", mutual: "Wants to connect · 6 mutual", online: false, kind: "requests", status: "pending", connection_id: "c6", outgoing: false },
  { id: "p7", initials: "EP", color: "#6d49d6", name: "Elena Park", role: "Founder · NovaPath", mutual: "Suggested · 19 mutual", online: true, kind: "discover" },
  { id: "p8", initials: "DB", color: "#2f8f5b", name: "David Bauer", role: "CPO · Helix Labs", mutual: "Suggested · 9 mutual", online: false, kind: "discover" },
  { id: "p9", initials: "NA", color: "#b8923d", name: "Nadia Ahmed", role: "GP · Summit Advisors", mutual: "Suggested · 13 mutual", online: false, kind: "discover" },
];

export const trendingSectors = [
  { name: "Investment Banking", open: 412, pct: 88 },
  { name: "Management Consulting", open: 318, pct: 68 },
  { name: "Private Equity", open: 204, pct: 44 },
];

export const careerInsights = [
  { label: "Profile Views", value: "347", sub: "+24% This week" },
  { label: "Applications", value: "12", sub: "+3 Active" },
  { label: "Saved Roles", value: "28", sub: "8 new matches" },
  { label: "Interview Rate", value: "62%", sub: "+7% vs avg 18%" },
];

// Resumes — 4 saved documents. Avg ATS = (94+91+78+81)/4 = 86%.
export const resumes: Resume[] = [
  { id: "res1", title: "Fintech Focused", kind: "ai", forCompany: "Meridian Capital", date: "May 28, 2026", sizeKb: 138, atsScore: 94 },
  { id: "res2", title: "VP Engineering — Stratos", kind: "ai", forCompany: "Stratos Ventures", date: "Jun 12, 2026", sizeKb: 149, atsScore: 91 },
  { id: "res3", title: "Senior PM — General", kind: "uploaded", forCompany: null, date: "Jun 10, 2026", sizeKb: 142, atsScore: 78 },
  { id: "res4", title: "Growth PM — General", kind: "uploaded", forCompany: null, date: "Jun 05, 2026", sizeKb: 131, atsScore: 81 },
];
