// Candidate portal data layer for the web app. Mirrors the mobile app's
// src/data/repo.ts + mock.ts + services/advisor.ts, but uses the web Supabase
// client and browser storage. Every function tries Supabase when configured and
// falls back to local mock data so the portal runs out of the box.

import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AnimalTrait, PersonaScores } from "@/lib/persona";

// ---------------------------------------------------------------------------
// TYPES (mirrors apps/mobile/src/data/types.ts)
// ---------------------------------------------------------------------------

export interface Experience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface Education {
  id: string;
  /** University / institution name. */
  school: string;
  /** Degree and field of study, e.g. "BSc Computer Science". */
  degree: string;
  /** Grade / CGPA / classification, e.g. "First Class · 3.8". */
  grade: string;
  dates: string;
}

export interface CandidateProfile {
  id: string;
  name: string;
  headline: string;
  location: string;
  years_exp: number;
  persona: AnimalTrait;
  about: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
  initials: string;
  profile_score: number;
  views: number;
  matches: number;
  animal_trait?: AnimalTrait | null;
  animal_scores?: PersonaScores | null;
  // Notification preferences (Settings > Notifications). Absent means "on" —
  // these columns default true, so older rows without them still read as opted in.
  notif_matches?: boolean;
  notif_messages?: boolean;
  notif_updates?: boolean;
  // Whether companies see full profile details (About/Skills/Experience/Education)
  // once matched (Settings > Privacy & Visibility). Absent means visible.
  profile_visible?: boolean;
}

export interface Role {
  id: string;
  company: string;
  initials: string;
  title: string;
  location: string;
  salary_min: number;
  salary_max: number;
  type: "Full-time" | "Hybrid" | "Remote";
  match: number;
  color: string;
  posted: string;
}

export interface SwipeCompany {
  id: string;
  initials: string;
  name: string;
  role: string;
  location: string;
  employees: string;
  match: number;
  tags: string[];
  package: string;
  perks: string[];
  // Richer job detail the employer posts (see the employer Post New Role form).
  description?: string | null;
  responsibilities?: string[];
  requirements?: string[];
  experienceLevel?: string | null;
  education?: string | null;
}

export interface Connection {
  /** The other candidate's profile id. */
  id: string;
  initials: string;
  color: string;
  name: string;
  role: string;
  mutual: string;
  online: boolean;
  kind: "network" | "requests" | "discover";
  /** Connection row status when one exists ('pending' | 'accepted' | 'declined'). */
  status?: string;
  /** The connections row id — needed to accept a request or open a chat. */
  connection_id?: string | null;
  /** True when I sent this pending request (so Discover shows "Requested"). */
  outgoing?: boolean;
}

/** A candidate-to-candidate direct message tied to a connection. */
export interface DirectMessage {
  id: string;
  connection_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** True when the signed-in user sent this message. */
  mine: boolean;
}

/** Ordered stages an application moves through, earliest first. */
export type ApplicationStage = "applied" | "review" | "interview" | "offer";

export const APPLICATION_STAGES: { key: ApplicationStage; label: string }[] = [
  { key: "applied", label: "Applied" },
  { key: "review", label: "Under Review" },
  { key: "interview", label: "Interview" },
  { key: "offer", label: "Offer" },
];

/** A job the candidate has applied to (swiped right on). */
export interface SubmittedJob {
  id: string;
  initials: string;
  name: string;
  role: string;
  location: string;
  employees: string;
  match: number;
  /** True once the company swiped right back (a mutual match). */
  matched: boolean;
  /** How far the application has progressed through the hiring pipeline. */
  stage: ApplicationStage;
  /** Date the application was submitted, pre-formatted for display. */
  date: string;
  /** The company-match thread id, so the candidate can message the employer. */
  matchId?: string | null;
  /** Expected salary the candidate submitted with this application, if given. */
  expectedSalary?: number | null;
  /** Last drawn salary the candidate submitted with this application, if given. */
  lastDrawnSalary?: number | null;
  /** Date each pipeline stage was reached, pre-formatted; null/absent if not reached yet. */
  stageDates: Partial<Record<ApplicationStage, string>>;
}

export interface ChatMessage {
  id: string;
  who: "ai" | "me";
  text: string;
  time: string;
}

export type SwipeDirection = "left" | "right" | "save";

export interface Resume {
  id: string;
  title: string;
  kind: "ai" | "uploaded";
  forCompany?: string | null;
  date: string;
  sizeKb: number;
  atsScore: number;
  /** Storage path for uploaded files; null for AI-generated resumes (no file). */
  storagePath?: string | null;
}

// ---------------------------------------------------------------------------
// MOCK DATA (mirrors apps/mobile/src/data/mock.ts)
// ---------------------------------------------------------------------------

export const mockProfile: CandidateProfile = {
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
  education: [
    {
      id: "edu1",
      school: "Cornell University",
      degree: "MBA, Technology Management",
      grade: "GPA 3.9 / 4.0",
      dates: "2015 — 2017",
    },
    {
      id: "edu2",
      school: "University of Michigan",
      degree: "BSc Computer Science",
      grade: "First Class Honours · 3.8",
      dates: "2010 — 2014",
    },
  ],
  initials: "A",
  profile_score: 94,
  views: 347,
  matches: 28,
  notif_matches: true,
  notif_messages: true,
  notif_updates: true,
  profile_visible: true,
  animal_trait: "Fox",
  animal_scores: {
    Fox: 11, Owl: 9, Eagle: 8, Cheetah: 6, Lion: 6, Octopus: 5,
    Ant: 5, Wolf: 4, Dolphin: 4, Elephant: 3, Horse: 3, Peacock: 2,
  },
};

// Candidates only see CelcomDigi roles — these mirror the CelcomDigi openings
// seeded in supabase/schema.sql. Used as the demo fallback when Supabase is off.
export const mockFeaturedRoles: Role[] = [
  { id: "r1", company: "CelcomDigi", initials: "CD", title: "AI Engineer", location: "Kuala Lumpur, MY", salary_min: 105000, salary_max: 150000, type: "Hybrid", match: 95, color: "#1573c4", posted: "Just now" },
  { id: "r2", company: "CelcomDigi", initials: "CD", title: "Software Developer", location: "Kuala Lumpur, MY", salary_min: 72000, salary_max: 102000, type: "Hybrid", match: 92, color: "#1573c4", posted: "1 day ago" },
  { id: "r3", company: "CelcomDigi", initials: "CD", title: "Senior Product Manager, Digital", location: "Kuala Lumpur, MY", salary_min: 90000, salary_max: 130000, type: "Hybrid", match: 90, color: "#1573c4", posted: "2 days ago" },
  { id: "r4", company: "CelcomDigi", initials: "CD", title: "Backend Developer", location: "Kuala Lumpur, MY", salary_min: 84000, salary_max: 118000, type: "Hybrid", match: 88, color: "#1573c4", posted: "3 days ago" },
  { id: "r5", company: "CelcomDigi", initials: "CD", title: "Corporate Strategy Manager", location: "Kuala Lumpur, MY", salary_min: 115000, salary_max: 155000, type: "Full-time", match: 84, color: "#1573c4", posted: "4 days ago" },
  { id: "r6", company: "CelcomDigi", initials: "CD", title: "Finance Business Partner", location: "Kuala Lumpur, MY", salary_min: 90000, salary_max: 120000, type: "Hybrid", match: 82, color: "#1573c4", posted: "5 days ago" },
  { id: "r7", company: "CelcomDigi", initials: "CD", title: "Human Resources Manager", location: "Kuala Lumpur, MY", salary_min: 85000, salary_max: 115000, type: "Hybrid", match: 80, color: "#1573c4", posted: "6 days ago" },
];

export const mockSwipeDeck: SwipeCompany[] = [
  {
    id: "c6", initials: "CD", name: "CelcomDigi", role: "Senior Product Manager, Digital",
    location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 90,
    tags: ["Product", "Telco", "Digital"], package: "$110K", perks: ["Medical", "Hybrid", "Bonus"],
    experienceLevel: "Senior",
    education: "Bachelor's degree in Business, Engineering, or related field",
    description:
      "Own the digital product roadmap for CelcomDigi's consumer app, partnering with engineering, design, and data to ship features used by millions across Malaysia.",
    responsibilities: [
      "Define and prioritise the product roadmap",
      "Partner with engineering & design from discovery to launch",
      "Analyse usage data and report on KPIs to leadership",
    ],
    requirements: [
      "5+ years in product management",
      "Experience shipping consumer mobile products",
      "Strong analytical and stakeholder-management skills",
    ],
  },
];

export const mockConnections: Connection[] = [
  { id: "p1", initials: "V", color: "#7c4dab", name: "Victoria Harmon", role: "Managing Partner · Arcadia Ventures", mutual: "14 mutual connections", online: true, kind: "network", status: "accepted", connection_id: "c1" },
  { id: "p2", initials: "J", color: "#2f6b4a", name: "James Whitfield", role: "Chief Investment Officer · Meridian", mutual: "8 mutual connections", online: false, kind: "network", status: "accepted", connection_id: "c2" },
  { id: "p3", initials: "S", color: "#3a6ea5", name: "Sophia Laurent", role: "VP Strategy · Luminary Group", mutual: "22 mutual connections", online: true, kind: "network", status: "accepted", connection_id: "c3" },
  { id: "p4", initials: "M", color: "#9a6b34", name: "Marcus Chen", role: "Director of Operations · Pinnacle", mutual: "5 mutual connections", online: false, kind: "network", status: "accepted", connection_id: "c4" },
  { id: "p5", initials: "R", color: "#b8553f", name: "Rachel Donovan", role: "Partner · Crestline Capital", mutual: "Wants to connect · 11 mutual", online: false, kind: "requests", status: "pending", connection_id: "c5", outgoing: false },
  { id: "p6", initials: "T", color: "#4a6d8c", name: "Thomas Krause", role: "Head of Talent · Vertex Group", mutual: "Wants to connect · 6 mutual", online: false, kind: "requests", status: "pending", connection_id: "c6", outgoing: false },
  { id: "p7", initials: "E", color: "#6d49d6", name: "Elena Park", role: "Founder · NovaPath", mutual: "Suggested · 19 mutual", online: true, kind: "discover" },
  { id: "p8", initials: "D", color: "#2f8f5b", name: "David Bauer", role: "CPO · Helix Labs", mutual: "Suggested · 9 mutual", online: false, kind: "discover" },
  { id: "p9", initials: "N", color: "#b8923d", name: "Nadia Ahmed", role: "GP · Summit Advisors", mutual: "Suggested · 13 mutual", online: false, kind: "discover" },
];

// Applications shown when Supabase isn't configured (demo fallback).
export const mockSubmittedJobs: SubmittedJob[] = [
  { id: "c6", initials: "CD", name: "CelcomDigi", role: "AI Engineer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 95, matched: true, stage: "interview", date: "Jul 14, 2026", matchId: "mock_match_c6", expectedSalary: 9500, lastDrawnSalary: 8200, stageDates: { applied: "Jul 14, 2026", review: "Jul 16, 2026", interview: "Jul 19, 2026" } },
  { id: "c6b", initials: "CD", name: "CelcomDigi", role: "Software Developer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 92, matched: true, stage: "offer", date: "Jul 12, 2026", matchId: "mock_match_c6b", expectedSalary: 8000, lastDrawnSalary: 6800, stageDates: { applied: "Jul 12, 2026", review: "Jul 14, 2026", interview: "Jul 17, 2026", offer: "Jul 20, 2026" } },
  { id: "c6c", initials: "CD", name: "CelcomDigi", role: "Backend Developer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 88, matched: true, stage: "review", date: "Jul 10, 2026", matchId: "mock_match_c6c", expectedSalary: 7200, lastDrawnSalary: null, stageDates: { applied: "Jul 10, 2026", review: "Jul 12, 2026" } },
  { id: "c6d", initials: "CD", name: "CelcomDigi", role: "Corporate Strategy Manager", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 84, matched: false, stage: "applied", date: "Jul 08, 2026", matchId: null, expectedSalary: null, lastDrawnSalary: null, stageDates: { applied: "Jul 08, 2026" } },
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

export const mockResumes: Resume[] = [
  { id: "res1", title: "Fintech Focused", kind: "ai", forCompany: "Meridian Capital", date: "May 28, 2026", sizeKb: 138, atsScore: 94, storagePath: null },
  { id: "res2", title: "VP Engineering — Stratos", kind: "ai", forCompany: "Stratos Ventures", date: "Jun 12, 2026", sizeKb: 149, atsScore: 91, storagePath: null },
  { id: "res3", title: "Senior PM — General", kind: "uploaded", forCompany: null, date: "Jun 10, 2026", sizeKb: 142, atsScore: 78, storagePath: null },
  { id: "res4", title: "Growth PM — General", kind: "uploaded", forCompany: null, date: "Jun 05, 2026", sizeKb: 131, atsScore: 81, storagePath: null },
];

// ---------------------------------------------------------------------------
// AUTH — real Supabase email/password, mirroring the mobile app's repo.ts.
// Sign up passes the name into user metadata; the handle_new_user DB trigger
// seeds the profiles row from it.
// ---------------------------------------------------------------------------

const NOT_CONFIGURED =
  "Supabase isn't configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.";

export interface SignUpResult {
  /** A session exists immediately (email confirmation is OFF in the project). */
  session: boolean;
  /** True when Supabase created the user but is waiting on email confirmation. */
  needsConfirmation: boolean;
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
}

export async function signUpWithEmail(email: string, password: string, name: string): Promise<SignUpResult> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: { data: { name: name.trim() } },
  });
  if (error) throw error;
  return { session: !!data.session, needsConfirmation: !data.session && !!data.user };
}

// ---------------------------------------------------------------------------
// LOGIN BYPASS — "try it now" for candidates. Unlike the employer/university
// demo logins (one fixed, shared account each — fine there since they front a
// curated, mostly-read-only dashboard), the interesting part of the candidate
// portal *is* the create-account workflow (Animal Persona quiz, profile
// setup), and a single shared candidate account would mean two people trying
// the bypass at once overwrite each other's profile/swipes/matches. So this
// mints a real, unique Supabase account per browser instead: first call signs
// up (landing on the normal onboarding flow exactly like a real candidate),
// and the generated credentials are cached in localStorage so the *same*
// browser signs back into the *same* account next time instead of minting a
// fresh one on every visit.
// ---------------------------------------------------------------------------

const BYPASS_CREDS_KEY = "mango.candidate_bypass_creds";

interface BypassCreds {
  email: string;
  password: string;
}

function loadBypassCreds(): BypassCreds | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BYPASS_CREDS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BypassCreds;
  } catch {
    return null;
  }
}

function saveBypassCreds(creds: BypassCreds): void {
  if (typeof window !== "undefined") window.localStorage.setItem(BYPASS_CREDS_KEY, JSON.stringify(creds));
}

function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  return Math.random().toString(36).slice(2, 14);
}

/**
 * Signs into a per-browser candidate account, creating one the first time
 * it's called on a given browser. Each generated account is a real Supabase
 * user with its own unique email, so it goes through the exact same sign-up
 * + onboarding path a real candidate would — it's just provisioned
 * automatically instead of asking for an email and password.
 */
export async function bypassCandidateSignIn(): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);

  const existing = loadBypassCreds();
  if (existing) {
    try {
      await signInWithEmail(existing.email, existing.password);
      return;
    } catch {
      // The cached account no longer works (e.g. deleted server-side) —
      // fall through and mint a fresh one below.
    }
  }

  const id = randomId();
  const creds: BypassCreds = {
    email: `candidate_bypass_${id}@example.com`,
    password: `Bypass-${id}-!1`,
  };
  const res = await signUpWithEmail(creds.email, creds.password, "Guest Candidate");
  if (!res.session) {
    throw new Error("This project requires email confirmation, so the instant bypass can't sign itself in — disable email confirmations in Supabase Auth settings, or create a real account.");
  }
  saveBypassCreds(creds);
}

// ---------------------------------------------------------------------------
// PROFILE
// ---------------------------------------------------------------------------

export async function getMyProfile(): Promise<CandidateProfile> {
  if (!isSupabaseConfigured) return mockProfile;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockProfile;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
  if (error || !data) return mockProfile;
  return data as unknown as CandidateProfile;
}

/** Persist edits to the signed-in user's profile. Returns the updated row. */
export async function updateMyProfile(patch: Partial<CandidateProfile>): Promise<CandidateProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from("profiles").update(patch).eq("id", uid).select("*").single();
  if (error) throw error;
  return data as unknown as CandidateProfile;
}

/** Change the signed-in user's email (Settings > Account & Security). Supabase sends a confirmation link to the new address before it takes effect. */
export async function updateMyEmail(email: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);
  const { error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
}

/** Change the signed-in user's password (Settings > Account & Security). */
export async function updateMyPassword(password: string): Promise<void> {
  if (!isSupabaseConfigured) throw new Error(NOT_CONFIGURED);
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// PROFILE SETUP — the About/Skills/Experience step is optional. Candidates can
// skip it during onboarding and complete it later from their profile. The skip
// is remembered in localStorage so the onboarding step doesn't reappear on
// every navigation while the profile is still empty. Keyed per signed-in user
// (not just per-browser) — a bare, unscoped key would leak one account's skip
// onto every other account that ever signs into the same browser, which is
// exactly what happens with the candidate login bypass: each click either
// reuses or mints a *different* Supabase user in the same browser, and an
// unscoped flag would make a fresh bypass account inherit some earlier
// account's skip and silently jump straight past profile setup.
// ---------------------------------------------------------------------------

const PROFILE_SETUP_SKIPPED_KEY = "mango.profile_setup_skipped";

function skipKey(uid: string | null): string {
  return uid ? `${PROFILE_SETUP_SKIPPED_KEY}:${uid}` : PROFILE_SETUP_SKIPPED_KEY;
}

/** True once the signed-in candidate has chosen to skip the profile setup step. */
export async function getProfileSetupSkipped(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(skipKey(await currentUid())) === "1";
}

/** Remember (or clear) that the signed-in candidate skipped profile setup. */
export async function setProfileSetupSkipped(skipped: boolean): Promise<void> {
  if (typeof window === "undefined") return;
  const key = skipKey(await currentUid());
  if (skipped) window.localStorage.setItem(key, "1");
  else window.localStorage.removeItem(key);
}

// ---------------------------------------------------------------------------
// ROLES / SWIPE DECK
// ---------------------------------------------------------------------------

// Featured roles carry display fields (match %, accent colour, "posted") that
// the roles table doesn't store, so — like the mobile app — these stay on
// curated demo data.
export async function getFeaturedRoles(): Promise<Role[]> {
  return mockFeaturedRoles;
}

export async function getSwipeDeck(): Promise<SwipeCompany[]> {
  if (!isSupabaseConfigured) return mockSwipeDeck;
  const { data, error } = await supabase.rpc("get_swipe_deck");
  if (error || !data) return mockSwipeDeck;
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    initials: (r.initials as string) ?? "•",
    name: (r.name as string) ?? "Company",
    role: (r.role as string) ?? "Open Role",
    location: (r.location as string) ?? "",
    employees: (r.employees as string) ?? "",
    match: (r.match as number) ?? 0,
    tags: (r.tags as string[] | null) ?? [],
    package: (r.package as string) ?? "",
    perks: (r.perks as string[] | null) ?? [],
    description: (r.description as string | null) ?? null,
    responsibilities: (r.responsibilities as string[] | null) ?? [],
    requirements: (r.requirements as string[] | null) ?? [],
    experienceLevel: (r.experience_level as string | null) ?? null,
    education: (r.education as string | null) ?? null,
  }));
}

/** Salary details a candidate fills in on the job card when matching a role. */
export interface ApplicationDetails {
  expectedSalary?: number | null;
  lastDrawnSalary?: number | null;
}

export async function recordSwipe(
  targetId: string,
  direction: SwipeDirection,
  details?: ApplicationDetails,
): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  await supabase.from("swipes").insert({
    user_id: uid,
    target_id: targetId,
    target_type: "role",
    direction,
    expected_salary: details?.expectedSalary ?? null,
    last_drawn_salary: details?.lastDrawnSalary ?? null,
  });
  // Right-swiping a role creates a match on its company via a DB trigger.
}

// ---------------------------------------------------------------------------
// CONNECTIONS
// ---------------------------------------------------------------------------

// Maps the employer's live hiring-pipeline stage (matches.stage — Applied,
// Screening, Shortlisted, Interview, Final Round, Offer, Hired, Rejected)
// down to the four-step tracker the candidate app shows.
function mapHireStage(hireStage: string | null, matched: boolean): ApplicationStage {
  if (!matched || !hireStage) return "applied";
  switch (hireStage) {
    case "Screening":
    case "Shortlisted":
      return "review";
    case "Interview":
    case "Final Round":
      return "interview";
    case "Offer":
    case "Hired":
      return "offer";
    default:
      return "applied";
  }
}

function fmtDate(v: unknown): string | undefined {
  return v ? new Date(v as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined;
}

// Jobs the signed-in candidate has applied to (right-swiped), newest first.
export async function getSubmittedJobs(): Promise<SubmittedJob[]> {
  if (!isSupabaseConfigured) return mockSubmittedJobs;
  const { data, error } = await supabase.rpc("get_my_submitted_jobs");
  if (error || !data) return mockSubmittedJobs;
  return (data as Record<string, unknown>[]).map((r) => {
    const matched = !!r.matched;
    const appliedDate = fmtDate(r.created_at) ?? "";
    return {
      id: String(r.id),
      initials: (r.initials as string) ?? "•",
      name: (r.name as string) ?? "Company",
      role: (r.role as string) ?? "Open Role",
      location: (r.location as string) ?? "",
      employees: (r.employees as string) ?? "",
      match: (r.match as number) ?? 0,
      matched,
      stage: mapHireStage((r.hire_stage as string | null) ?? null, matched),
      date: appliedDate,
      stageDates: {
        applied: appliedDate,
        review: fmtDate(r.review_at),
        interview: fmtDate(r.interview_at),
        offer: fmtDate(r.offer_at),
      },
      matchId: r.match_id ? String(r.match_id) : null,
      expectedSalary: (r.expected_salary as number | null) ?? null,
      lastDrawnSalary: (r.last_drawn_salary as number | null) ?? null,
    };
  });
}

/**
 * `search` only applies to `kind: "discover"` — it's the only segment large
 * enough (every other candidate in the system) to need it. Network/Requests
 * stay small, unfiltered fetches; the page does client-side search on those.
 */
export async function getConnections(kind: Connection["kind"], search?: string): Promise<Connection[]> {
  const q = search?.trim().toLowerCase();
  if (!isSupabaseConfigured) {
    const list = mockConnections.filter((c) => c.kind === kind);
    return q ? list.filter((c) => `${c.name} ${c.role}`.toLowerCase().includes(q)) : list;
  }
  let query = supabase.from("connections_view").select("*").eq("kind", kind);
  if (kind === "discover") {
    if (q) {
      // Strip characters that are syntactically significant to PostgREST's
      // filter grammar (,()) or to ilike itself (%_) so a search term can't
      // smuggle in extra filter clauses or wildcard behavior.
      const safe = q.replace(/[,()%_]/g, " ").trim();
      if (safe) query = query.or(`name.ilike.%${safe}%,role.ilike.%${safe}%`);
      query = query.limit(50);
    } else {
      query = query.limit(24);
    }
  }
  const { data, error } = await query;
  if (error || !data) return mockConnections.filter((c) => c.kind === kind);
  return data as unknown as Connection[];
}

// ---------------------------------------------------------------------------
// PEER CONNECTIONS & MESSAGING — candidates add other candidates from Discover,
// accept the requests they receive, and DM each other. Requests + messages
// stream over Supabase Realtime (see subscribeConnections / subscribeMessages).
// Mirrors apps/mobile/src/data/repo.ts.
// ---------------------------------------------------------------------------

async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Send a connection request to another candidate (I'm the requester). Returns
 * the new connection row's id. No-op-safe in mock mode (returns a synthetic id).
 */
export async function addConnection(profileId: string): Promise<string | null> {
  if (!isSupabaseConfigured) return `mock_conn_${profileId}`;
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("connections")
    .insert({ requester_id: uid, addressee_id: profileId, status: "pending" })
    .select("id")
    .single();
  if (error) throw error;
  return (data as { id: string }).id;
}

/** Accept a pending request (only the addressee may, enforced by RLS). */
export async function acceptConnection(connectionId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("connections").update({ status: "accepted" }).eq("id", connectionId);
  if (error) throw error;
}

/** Decline a pending request. */
export async function declineConnection(connectionId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("connections").update({ status: "declined" }).eq("id", connectionId);
  if (error) throw error;
}

/** How many pending requests are waiting on me (the live Requests badge). */
export async function getRequestCount(): Promise<number> {
  if (!isSupabaseConfigured) return mockConnections.filter((c) => c.kind === "requests").length;
  const uid = await currentUid();
  if (!uid) return 0;
  const { count, error } = await supabase
    .from("connections")
    .select("id", { count: "exact", head: true })
    .eq("addressee_id", uid)
    .eq("status", "pending");
  if (error) return 0;
  return count ?? 0;
}

// Mock chat store so the DM UI is demoable without Supabase configured.
const mockThreads: Record<string, DirectMessage[]> = {};

/** Full message history for a connection, oldest first. */
export async function getMessages(connectionId: string): Promise<DirectMessage[]> {
  if (!isSupabaseConfigured) return mockThreads[connectionId] ?? [];
  const uid = await currentUid();
  const { data, error } = await supabase
    .from("messages")
    .select("id, connection_id, sender_id, body, created_at")
    .eq("connection_id", connectionId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    connection_id: String(r.connection_id),
    sender_id: String(r.sender_id),
    body: String(r.body),
    created_at: String(r.created_at),
    mine: r.sender_id === uid,
  }));
}

/** Send a message on a connection. Returns the stored row. */
export async function sendMessage(connectionId: string, body: string): Promise<DirectMessage | null> {
  const text = body.trim();
  if (!text) return null;
  if (!isSupabaseConfigured) {
    const msg: DirectMessage = {
      id: `mock_msg_${Date.now()}`,
      connection_id: connectionId,
      sender_id: "me",
      body: text,
      created_at: new Date().toISOString(),
      mine: true,
    };
    (mockThreads[connectionId] ??= []).push(msg);
    return msg;
  }
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("messages")
    .insert({ connection_id: connectionId, sender_id: uid, body: text })
    .select("id, connection_id, sender_id, body, created_at")
    .single();
  if (error) throw error;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    connection_id: String(r.connection_id),
    sender_id: String(r.sender_id),
    body: String(r.body),
    created_at: String(r.created_at),
    mine: true,
  };
}

/**
 * Live-subscribe to changes on my connections (new requests, accepts). Invokes
 * `onChange` on every insert/update. Returns an unsubscribe function. No-op in
 * mock mode.
 */
export function subscribeConnections(onChange: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel("connections-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "connections" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Live-subscribe to new messages on a connection. `onInsert` receives each new
 * message (already tagged `mine`). Returns an unsubscribe function.
 */
export function subscribeMessages(
  connectionId: string,
  onInsert: (msg: DirectMessage) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};
  let uid: string | null = null;
  currentUid().then((id) => (uid = id));
  const channel = supabase
    .channel(`messages-${connectionId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `connection_id=eq.${connectionId}` },
      (payload) => {
        const r = payload.new as Record<string, unknown>;
        onInsert({
          id: String(r.id),
          connection_id: String(r.connection_id),
          sender_id: String(r.sender_id),
          body: String(r.body),
          created_at: String(r.created_at),
          mine: r.sender_id === uid,
        });
      },
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// NOTIFICATIONS — messages, connection requests/accepts, new matches, and
// hiring-stage changes. All rows come from triggers on messages/connections/
// matches (see supabase/schema.sql) — this is read/mark-read only, there's no
// client-side insert path.
// ---------------------------------------------------------------------------

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

// Demo fallback so the bell has something to show when Supabase isn't configured.
const mockNotifications: AppNotification[] = [
  { id: "n1", kind: "message", title: "Victoria Harmon sent you a message", body: "Would love to connect about the PM role…", link: "/candidate/connect", read: false, createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
  { id: "n2", kind: "stage_change", title: "CelcomDigi moved your application to Interview", body: null, link: "/candidate/applications", read: false, createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: "n3", kind: "connection_request", title: "Rachel Donovan wants to connect", body: null, link: "/candidate/connect", read: true, createdAt: new Date(Date.now() - 26 * 3600_000).toISOString() },
  { id: "n4", kind: "match", title: "You matched with CelcomDigi", body: "Your application is now in their pipeline.", link: "/candidate/applications", read: true, createdAt: new Date(Date.now() - 3 * 86_400_000).toISOString() },
];

function rowToNotification(r: Record<string, unknown>): AppNotification {
  return {
    id: String(r.id),
    kind: String(r.kind),
    title: String(r.title),
    body: (r.body as string | null) ?? null,
    link: (r.link as string | null) ?? null,
    read: !!r.read_at,
    createdAt: String(r.created_at),
  };
}

/** Most recent notifications for the signed-in user, newest first. */
export async function getNotifications(limit = 30): Promise<AppNotification[]> {
  if (!isSupabaseConfigured) return mockNotifications;
  const { data, error } = await supabase
    .from("notifications")
    .select("id, kind, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map(rowToNotification);
}

/** Count of unread notifications, for the sidebar bell badge. */
export async function getUnreadNotificationCount(): Promise<number> {
  if (!isSupabaseConfigured) return mockNotifications.filter((n) => !n.read).length;
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
}

export async function markAllNotificationsRead(): Promise<void> {
  if (!isSupabaseConfigured) return;
  const uid = await currentUid();
  if (!uid) return;
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", uid).is("read_at", null);
}

let notificationsChannelSeq = 0;

/**
 * Live-subscribe to new/updated notifications. No-op in mock mode.
 * NotificationBell can be mounted more than once at a time (sidebar + page
 * header both render one), so the channel name is suffixed with a counter —
 * a shared static name would make the second `.channel()` call reuse the
 * first's already-subscribed channel, and Supabase throws if you attach a
 * `postgres_changes` callback after `.subscribe()` has already run.
 */
export function subscribeNotifications(onChange: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel(`notifications-live-${++notificationsChannelSeq}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------------------------------------------------------------------------
// SAVED JOBS (browser localStorage, mirrors the mobile AsyncStorage store)
// ---------------------------------------------------------------------------

const SAVED_JOBS_KEY = "mango.saved_jobs";

function readSaved(): Role[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SAVED_JOBS_KEY) ?? "[]");
    return Array.isArray(parsed) ? (parsed as Role[]) : [];
  } catch {
    return [];
  }
}

function writeSaved(jobs: Role[]) {
  if (typeof window !== "undefined") window.localStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(jobs));
}

export function getSavedJobs(): Role[] {
  return readSaved();
}

export function toggleSavedJob(role: Role): { saved: boolean; jobs: Role[] } {
  const current = readSaved();
  const isSaved = current.some((r) => r.id === role.id);
  const jobs = isSaved ? current.filter((r) => r.id !== role.id) : [role, ...current];
  writeSaved(jobs);
  return { saved: !isSaved, jobs };
}

export function unsaveJob(roleId: string): Role[] {
  const jobs = readSaved().filter((r) => r.id !== roleId);
  writeSaved(jobs);
  return jobs;
}

// ---------------------------------------------------------------------------
// ANIMAL PERSONA
// ---------------------------------------------------------------------------

const TRAIT_KEY = "mango.animal_trait";
const SCORES_KEY = "mango.animal_scores";

export async function getMyAnimalTrait(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return typeof window === "undefined" ? null : window.localStorage.getItem(TRAIT_KEY);
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from("profiles").select("animal_trait").eq("id", uid).single();
  if (error || !data) return null;
  return (data as { animal_trait: string | null }).animal_trait ?? null;
}

export async function saveMyAnimalTrait(trait: AnimalTrait, scores: PersonaScores): Promise<void> {
  if (!isSupabaseConfigured) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TRAIT_KEY, trait);
      window.localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
    }
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Cannot save persona: no signed-in user.");
  const { data, error } = await supabase
    .from("profiles")
    .update({ animal_trait: trait, animal_scores: scores })
    .eq("id", uid)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) throw new Error("Persona not saved: no profile row for this user.");
}

export async function resetMyAnimalTrait(): Promise<void> {
  if (!isSupabaseConfigured) {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TRAIT_KEY);
      window.localStorage.removeItem(SCORES_KEY);
    }
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  await supabase.from("profiles").update({ animal_trait: null }).eq("id", uid);
}

// ---------------------------------------------------------------------------
// RESUMES
// ---------------------------------------------------------------------------

function rowToResume(row: Record<string, unknown>): Resume {
  return {
    id: String(row.id),
    title: (row.title as string) ?? (row.label as string) ?? "Resume",
    kind: (row.kind as Resume["kind"]) ?? "uploaded",
    forCompany: (row.for_company as string | null) ?? null,
    date: row.created_at
      ? new Date(row.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
    sizeKb: (row.size_kb as number) ?? 0,
    atsScore: (row.ats_score as number) ?? 0,
    storagePath: (row.storage_path as string | null) ?? null,
  };
}

/**
 * A short-lived signed URL to view/download the signed-in candidate's own
 * resume file from the private `resumes` Storage bucket. Access is enforced by
 * the "resumes own" Storage RLS policy (supabase/schema.sql).
 */
export async function getResumeFileUrl(storagePath: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(storagePath, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

export async function getResumes(): Promise<Resume[]> {
  if (!isSupabaseConfigured) return mockResumes;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mockResumes;
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error || !data) return mockResumes;
  return (data as Record<string, unknown>[]).map(rowToResume);
}

/**
 * Create a role-targeted AI resume. Routes through the "generate-resume"
 * Supabase Edge Function, which calls Claude to draft real, tailored content
 * grounded in the candidate's own profile, computes a keyword-overlap ATS
 * score, and stores the result as a text file (so it's viewable/downloadable
 * the same way an uploaded resume is). Falls back to a synthesized demo
 * record when Supabase isn't configured, matching every other function here.
 */
export async function createResume(input: { targetRole: string; targetCompany?: string }): Promise<Resume> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.functions.invoke("generate-resume", {
      body: { targetRole: input.targetRole, targetCompany: input.targetCompany },
    });
    if (error) throw error;
    return rowToResume(data.resume as Record<string, unknown>);
  }
  return {
    id: `res_${Date.now()}`,
    title: input.targetRole,
    kind: "ai",
    forCompany: input.targetCompany?.trim() || null,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    sizeKb: 130 + Math.floor(Math.random() * 30),
    atsScore: 88 + Math.floor(Math.random() * 9),
  };
}

/** Upload a resume file the user picked in the browser. Stores the bytes in the
 * `resumes` Storage bucket (under the user's own folder) and inserts a row. */
export async function uploadResume(file: File): Promise<Resume> {
  const sizeKb = Math.max(1, Math.round(file.size / 1024));
  const atsScore = 68 + Math.floor(Math.random() * 20); // 68–87
  const title = file.name.replace(/\.[^./\\]+$/, "");
  const resume: Resume = {
    id: `res_${Date.now()}`,
    title,
    kind: "uploaded",
    forCompany: null,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    sizeKb,
    atsScore,
  };

  if (!isSupabaseConfigured) return resume;

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return resume;

  const storagePath = `${uid}/${Date.now()}_${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("resumes")
    .insert({ user_id: uid, title, label: title, kind: "uploaded", storage_path: storagePath, size_kb: sizeKb, ats_score: atsScore })
    .select()
    .single();
  if (error) throw error;
  return data ? rowToResume(data as Record<string, unknown>) : resume;
}

/**
 * Upload an optional cover letter the candidate picked in the browser. Stored
 * alongside resumes in the same Storage bucket (namespaced under the user's own
 * folder). Cover letters are optional and don't gate matching, so no metadata
 * row is inserted into the resumes table. Returns the display name.
 */
export async function uploadCoverLetter(file: File): Promise<{ name: string }> {
  const name = file.name.replace(/\.[^./\\]+$/, "");
  if (!isSupabaseConfigured) return { name };

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return { name };

  const storagePath = `${uid}/cover-letters/${Date.now()}_${file.name}`;
  const { error } = await supabase.storage
    .from("resumes")
    .upload(storagePath, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (error) throw error;
  return { name };
}

// ---------------------------------------------------------------------------
// AI CAREER ADVISOR
// ---------------------------------------------------------------------------
// Still a simulation (no real model call) — but every number and name below
// comes from the signed-in candidate's own profile and applications instead
// of a fixed script, so the advice tracks whoever is actually logged in and
// changes as they apply to more roles.

export interface AdvisorSnapshot {
  name: string;
  headline: string;
  yearsExp: number;
  topSkills: string[];
  applications: SubmittedJob[];
  advancedCount: number;
  interviewRatePct: number;
  topMatches: SubmittedJob[];
  topFitPct: number | null;
  salaryRange: { min: number; max: number } | null;
  /** Open roles not yet swiped on — what's actually available right now. */
  openRoles: SwipeCompany[];
}

export async function getAdvisorSnapshot(): Promise<AdvisorSnapshot> {
  const [profile, applications, openRoles] = await Promise.all([
    getMyProfile(),
    getSubmittedJobs(),
    getSwipeDeck(),
  ]);
  const advanced = applications.filter((a) => a.stage === "interview" || a.stage === "offer");
  const salaries = applications.map((a) => a.expectedSalary).filter((v): v is number => !!v);
  const topMatches = [...applications].sort((a, b) => b.match - a.match).slice(0, 2);
  return {
    name: profile.name,
    headline: profile.headline || "your target role",
    yearsExp: profile.years_exp ?? 0,
    topSkills: (profile.skills ?? []).slice(0, 3),
    applications,
    advancedCount: advanced.length,
    interviewRatePct: applications.length ? Math.round((advanced.length / applications.length) * 100) : 0,
    topMatches,
    topFitPct: topMatches[0]?.match ?? null,
    salaryRange: salaries.length ? { min: Math.min(...salaries), max: Math.max(...salaries) } : null,
    openRoles: [...openRoles].sort((a, b) => b.match - a.match),
  };
}

function fmtMoney(v: number): string {
  return `$${v.toLocaleString()}`;
}

function years(n: number): string {
  return `${n} year${n === 1 ? "" : "s"}`;
}

function answerRoles(s: AdvisorSnapshot): string {
  const skillsText = s.topSkills.length ? s.topSkills.join(", ") : "the skills on your profile";
  if (!s.applications.length) {
    return `With ${years(s.yearsExp)} as a ${s.headline} and strengths in ${skillsText}, I don't have any applications to judge fit against yet — swipe right on a few roles in Discover and I'll tell you which ones actually suit you.`;
  }
  const names = s.topMatches.map((m) => `${m.name} (${m.match}% fit)`).join(" and ");
  return `Based on your ${years(s.yearsExp)} as a ${s.headline} and your ${skillsText} background, your strongest matches so far are ${names}. ${s.interviewRatePct}% of your applications have reached interview stage — prioritize roles above that top match's fit score, they convert best for you.`;
}

function answerSalary(s: AdvisorSnapshot): string {
  if (!s.salaryRange) {
    return `You haven't entered an expected salary on any application yet, so I don't have a real range to work from for you as a ${s.headline}. Add one next time you apply and I can tell you where you stand.`;
  }
  const { min, max } = s.salaryRange;
  const spread = min === max
    ? fmtMoney(min)
    : `${fmtMoney(min)}–${fmtMoney(max)}`;
  return `Across the ${s.applications.length} role${s.applications.length === 1 ? "" : "s"} you've applied to, your expected salary has ranged ${spread}. With a ${s.interviewRatePct}% interview rate, you're in a position to anchor near the top of that range.`;
}

function answerIndustries(s: AdvisorSnapshot): string {
  if (!s.applications.length) {
    return `I don't have any applications from you yet, so I can't tell you which industries you're converting in. Apply to a few roles and check back.`;
  }
  const companies = Array.from(new Set(s.applications.map((a) => a.name))).slice(0, 3).join(", ");
  const top = s.topMatches[0];
  return `Looking at where you've applied — ${companies} — and a ${s.interviewRatePct}% interview rate, your strongest signal is ${top?.name ?? "your top match"} at ${top?.match ?? 0}% fit. Lean into companies similar to that one.`;
}

function answerWorkType(s: AdvisorSnapshot): string {
  if (!s.applications.length) {
    return `You haven't applied anywhere yet, so I can't tell what's converting for you. Apply to a mix of roles and locations and I'll tell you which is working.`;
  }
  const locations = Array.from(new Set(s.applications.map((a) => a.location).filter(Boolean))).slice(0, 3);
  const locText = locations.length ? locations.join(", ") : "a few different locations";
  const top = s.topMatches[0];
  return `Your ${s.applications.length} application${s.applications.length === 1 ? "" : "s"} span ${locText}. Your best match, ${top?.name ?? "your top pick"}, sits at ${top?.match ?? 0}% fit — a stronger signal for you right now than location alone.`;
}

// What's actually open right now that the candidate hasn't applied to yet —
// the swipe deck already excludes anything they've swiped on, so this is a
// real "what's available" answer, not a recommendation from thin air.
function answerAvailableJobs(s: AdvisorSnapshot): string {
  if (!s.openRoles.length) {
    return `There's nothing new in your deck right now — you've applied to or passed on everything currently open. Check back as new roles get posted.`;
  }
  const top = s.openRoles
    .slice(0, 3)
    .map((r) => `${r.role} at ${r.name} (${r.match}% fit${r.package ? `, ${r.package}` : ""})`)
    .join("; ");
  return `You have ${s.openRoles.length} open role${s.openRoles.length === 1 ? "" : "s"} in your deck you haven't applied to yet. Best fits right now: ${top}. Swipe right on anything above ${s.openRoles[0].match >= 90 ? 85 : 75}% — those convert best.`;
}

// "How am I doing" — a real breakdown of the candidate's own pipeline, not a
// canned interview-rate line.
function answerStatus(s: AdvisorSnapshot): string {
  if (!s.applications.length) {
    return `You don't have any active applications yet — once you apply to a role I can track how it's progressing for you.`;
  }
  const counts = { applied: 0, review: 0, interview: 0, offer: 0 };
  for (const a of s.applications) counts[a.stage]++;
  const parts = APPLICATION_STAGES
    .filter((st) => counts[st.key] > 0)
    .map((st) => `${counts[st.key]} ${st.label.toLowerCase()}`)
    .join(", ");
  const top = s.topMatches[0];
  return `You have ${s.applications.length} application${s.applications.length === 1 ? "" : "s"} out: ${parts}. Your strongest one is ${top?.name} — ${top?.role} at ${top?.match}% fit.`;
}

function answerGeneral(s: AdvisorSnapshot): string {
  if (!s.applications.length) {
    return `I don't have any applications from you yet, so I can't give you data-backed advice. Head to Discover, apply to a few roles, and come back — I'll have real numbers to work with.`;
  }
  const top = s.topMatches[0];
  return `You've applied to ${s.applications.length} role${s.applications.length === 1 ? "" : "s"} with a ${s.interviewRatePct}% interview rate. Your top match right now is ${top?.name} at ${top?.match}% fit — that's the one I'd focus your energy on.`;
}

export async function askAdvisor(question: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 550));
  const snapshot = await getAdvisorSnapshot();
  const q = question.toLowerCase();

  // Order matters: check the more specific intents before generic ones like
  // "job"/"role" so e.g. "what jobs are available" doesn't fall into the
  // suitability branch just because it contains "job".
  if (q.includes("available") || q.includes("opening") || q.includes("open role") || q.includes("open position") || q.includes("any jobs") || q.includes("new jobs"))
    return answerAvailableJobs(snapshot);
  if (q.includes("salary") || q.includes("pay") || q.includes("compensation") || q.includes("wage") || q.includes("earn"))
    return answerSalary(snapshot);
  if (q.includes("industr") || q.includes("sector") || q.includes("field"))
    return answerIndustries(snapshot);
  if (q.includes("remote") || q.includes("on-site") || q.includes("onsite") || q.includes("hybrid") || q.includes("where"))
    return answerWorkType(snapshot);
  if (q.includes("status") || q.includes("progress") || q.includes("how am i doing") || q.includes("how are my") || q.includes("interview"))
    return answerStatus(snapshot);
  if (q.includes("role") || q.includes("fit") || q.includes("suit") || q.includes("best") || q.includes("qualif") || q.includes("job"))
    return answerRoles(snapshot);
  return answerGeneral(snapshot);
}

export const suggestedQuestions = [
  "What roles suit me best?",
  "What jobs are available right now?",
  "My ideal salary range",
  "How are my applications doing?",
  "Best industries for me",
  "Remote vs on-site preference",
];
