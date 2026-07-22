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
  initials: string;
  profile_score: number;
  views: number;
  matches: number;
  animal_trait?: AnimalTrait | null;
  animal_scores?: PersonaScores | null;
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
  /** Date the application was submitted, pre-formatted for display. */
  date: string;
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
  { id: "c6", initials: "CD", name: "CelcomDigi", role: "Senior Product Manager, Digital", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 90, tags: ["Product", "Telco", "Digital"], package: "$110K", perks: ["Medical", "Hybrid", "Bonus"] },
];

export const mockConnections: Connection[] = [
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

// Applications shown when Supabase isn't configured (demo fallback).
export const mockSubmittedJobs: SubmittedJob[] = [
  { id: "c6", initials: "CD", name: "CelcomDigi", role: "AI Engineer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 95, matched: true, date: "Jul 14, 2026" },
  { id: "c6b", initials: "CD", name: "CelcomDigi", role: "Software Developer", location: "Kuala Lumpur, MY", employees: "12,000 emp.", match: 92, matched: false, date: "Jul 12, 2026" },
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
  { id: "res1", title: "Fintech Focused", kind: "ai", forCompany: "Meridian Capital", date: "May 28, 2026", sizeKb: 138, atsScore: 94 },
  { id: "res2", title: "VP Engineering — Stratos", kind: "ai", forCompany: "Stratos Ventures", date: "Jun 12, 2026", sizeKb: 149, atsScore: 91 },
  { id: "res3", title: "Senior PM — General", kind: "uploaded", forCompany: null, date: "Jun 10, 2026", sizeKb: 142, atsScore: 78 },
  { id: "res4", title: "Growth PM — General", kind: "uploaded", forCompany: null, date: "Jun 05, 2026", sizeKb: 131, atsScore: 81 },
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
  return data as unknown as SwipeCompany[];
}

export async function recordSwipe(targetId: string, direction: SwipeDirection): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  await supabase.from("swipes").insert({
    user_id: uid,
    target_id: targetId,
    target_type: "role",
    direction,
  });
  // Right-swiping a role creates a match on its company via a DB trigger.
}

// ---------------------------------------------------------------------------
// CONNECTIONS
// ---------------------------------------------------------------------------

// Jobs the signed-in candidate has applied to (right-swiped), newest first.
export async function getSubmittedJobs(): Promise<SubmittedJob[]> {
  if (!isSupabaseConfigured) return mockSubmittedJobs;
  const { data, error } = await supabase.rpc("get_my_submitted_jobs");
  if (error || !data) return mockSubmittedJobs;
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    initials: (r.initials as string) ?? "•",
    name: (r.name as string) ?? "Company",
    role: (r.role as string) ?? "Open Role",
    location: (r.location as string) ?? "",
    employees: (r.employees as string) ?? "",
    match: (r.match as number) ?? 0,
    matched: !!r.matched,
    date: r.created_at
      ? new Date(r.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
  }));
}

export async function getConnections(kind: Connection["kind"]): Promise<Connection[]> {
  if (!isSupabaseConfigured) return mockConnections.filter((c) => c.kind === kind);
  const { data, error } = await supabase.from("connections_view").select("*").eq("kind", kind);
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
  };
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

/** Create a role-targeted AI resume (synthesized in the prototype). */
export async function createResume(input: { targetRole: string; targetCompany?: string }): Promise<Resume> {
  const atsScore = 88 + Math.floor(Math.random() * 9); // 88–96
  const resume: Resume = {
    id: `res_${Date.now()}`,
    title: input.targetRole,
    kind: "ai",
    forCompany: input.targetCompany?.trim() || null,
    date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
    sizeKb: 130 + Math.floor(Math.random() * 30),
    atsScore,
  };
  if (isSupabaseConfigured) {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (uid) {
      const { data } = await supabase
        .from("resumes")
        .insert({ user_id: uid, title: resume.title, kind: "ai", for_company: resume.forCompany, size_kb: resume.sizeKb, ats_score: resume.atsScore })
        .select()
        .single();
      if (data) return rowToResume(data as Record<string, unknown>);
    }
  }
  return resume;
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

// ---------------------------------------------------------------------------
// AI CAREER ADVISOR (mirrors apps/mobile/src/services/advisor.ts)
// ---------------------------------------------------------------------------

const CANNED: Record<string, string> = {
  "What roles suit me best?":
    "Based on your 8 years in B2B SaaS and fintech, you're an exceptional fit for Senior PM and Director of Product roles at growth-stage fintechs. Meridian Capital (94% fit) and Luminary Group both align tightly with your roadmap and stakeholder strengths.",
  "My ideal salary range":
    "For Senior PM roles in fintech with your profile, the market range is $185K–$235K base in NY. Your interview rate (62%) gives you strong leverage — I'd anchor negotiations near $220K+.",
  "Best industries for me":
    "Your strongest signals point to Fintech, Investment tech, and B2B SaaS. Investment Banking platforms are trending (412 open roles) and reward your data-analytics and OKR experience.",
  "Remote vs on-site preference":
    "Your profile is set to Hybrid, which matches 3 of your top 5 company matches. If flexibility matters most, Stratos Ventures and Apex Partners both offer flexible arrangements.",
};

export async function askAdvisor(question: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 550));
  return (
    CANNED[question] ??
    "Looking at your profile and live matches, prioritize roles above 88% fit — they convert best for candidates with your interview rate."
  );
}

export const suggestedQuestions = [
  "What roles suit me best?",
  "My ideal salary range",
  "Best industries for me",
  "Remote vs on-site preference",
];
