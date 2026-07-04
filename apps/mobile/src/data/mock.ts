import { Connection, Profile, Role, SwipeCompany } from "./types";

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
};

export const featuredRoles: Role[] = [
  {
    id: "r1",
    company: "Meridian Capital",
    initials: "MC",
    title: "Senior Product Manager",
    location: "New York, NY",
    salary_min: 180000,
    salary_max: 220000,
    type: "Hybrid",
    match: 94,
    color: "#2563c4",
    posted: "1 day ago",
  },
  {
    id: "r2",
    company: "Stratos Ventures",
    initials: "SV",
    title: "VP of Engineering",
    location: "San Francisco, CA",
    salary_min: 240000,
    salary_max: 300000,
    type: "Full-time",
    match: 88,
    color: "#6d49d6",
    posted: "2 days ago",
  },
  {
    id: "r3",
    company: "Apex Partners",
    initials: "AP",
    title: "Chief of Staff",
    location: "Chicago, IL",
    salary_min: 160000,
    salary_max: 190000,
    type: "Hybrid",
    match: 76,
    color: "#2f8f5b",
    posted: "3 days ago",
  },
];

export const swipeDeck: SwipeCompany[] = [
  {
    id: "c1",
    initials: "SA",
    name: "Summit Advisors",
    role: "Managing Director",
    location: "Boston, MA",
    employees: "240 emp.",
    match: 82,
    tags: ["Strategy", "Consulting", "Leadership"],
    package: "$260K",
    perks: ["Partnership", "Travel Budget", "Pension"],
  },
  {
    id: "c2",
    initials: "MC",
    name: "Meridian Capital",
    role: "Senior Product Manager",
    location: "New York, NY",
    employees: "180 emp.",
    match: 94,
    tags: ["Product", "Fintech", "Strategy"],
    package: "$200K",
    perks: ["Equity", "Remote", "Health"],
  },
  {
    id: "c3",
    initials: "SV",
    name: "Stratos Ventures",
    role: "VP of Engineering",
    location: "San Francisco, CA",
    employees: "320 emp.",
    match: 88,
    tags: ["Engineering", "SaaS", "Leadership"],
    package: "$270K",
    perks: ["Equity", "401k", "Flexible"],
  },
  {
    id: "c4",
    initials: "AP",
    name: "Apex Partners",
    role: "Chief of Staff",
    location: "Chicago, IL",
    employees: "95 emp.",
    match: 76,
    tags: ["Operations", "Strategy"],
    package: "$175K",
    perks: ["Bonus", "Hybrid", "Pension"],
  },
  {
    id: "c5",
    initials: "LG",
    name: "Luminary Group",
    role: "VP Strategy",
    location: "New York, NY",
    employees: "140 emp.",
    match: 91,
    tags: ["Strategy", "Consulting"],
    package: "$230K",
    perks: ["Equity", "Travel", "Health"],
  },
];

export const connections: Connection[] = [
  { id: "p1", initials: "VH", color: "#7c4dab", name: "Victoria Harmon", role: "Managing Partner · Arcadia Ventures", mutual: "14 mutual connections", online: true, kind: "network" },
  { id: "p2", initials: "JW", color: "#2f6b4a", name: "James Whitfield", role: "Chief Investment Officer · Meridian", mutual: "8 mutual connections", online: false, kind: "network" },
  { id: "p3", initials: "SL", color: "#3a6ea5", name: "Sophia Laurent", role: "VP Strategy · Luminary Group", mutual: "22 mutual connections", online: true, kind: "network" },
  { id: "p4", initials: "MC", color: "#9a6b34", name: "Marcus Chen", role: "Director of Operations · Pinnacle", mutual: "5 mutual connections", online: false, kind: "network" },
  { id: "p5", initials: "RD", color: "#b8553f", name: "Rachel Donovan", role: "Partner · Crestline Capital", mutual: "Wants to connect · 11 mutual", online: false, kind: "requests" },
  { id: "p6", initials: "TK", color: "#4a6d8c", name: "Thomas Krause", role: "Head of Talent · Vertex Group", mutual: "Wants to connect · 6 mutual", online: false, kind: "requests" },
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
