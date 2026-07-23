import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import type { AnimalTrait, HireStage, MatchedCandidate } from "@/lib/types";

// Live employer data. Each call returns null / [] when Supabase isn't configured
// so the dashboard falls back to mock data (lib/mock.ts), mirroring the mobile
// app's repo pattern.

export interface Company {
  id: string;
  name: string;
  initials: string;
}

/** The company owned by the signed-in employer, or null. */
export async function getMyCompany(): Promise<Company | null> {
  if (!isSupabaseConfigured) return null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("companies")
    .select("id,name,initials")
    .eq("owner_id", uid)
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return data as Company;
}

// ---------------------------------------------------------------------------
// EMPLOYER SIGN-UP — self-serve account creation, separate from candidates.
// A startup / small company signs up, and we provision their account + company
// and grant access immediately (instant self-serve). Company size is captured so
// the dashboard and matching can reflect a company's stage.
// ---------------------------------------------------------------------------

/** Company-size bands offered on the employer sign-up form. */
export const EMPLOYER_SIZES: { value: string; label: string }[] = [
  { value: "1-10", label: "Startup · 1–10" },
  { value: "11-50", label: "Small · 11–50" },
  { value: "51-200", label: "Scale-up · 51–200" },
  { value: "200+", label: "Established · 200+" },
];

function sizeToStage(size: string): string {
  switch (size) {
    case "1-10": return "Startup";
    case "11-50": return "Small";
    case "51-200": return "Scale-up";
    default: return "Established";
  }
}

export interface EmployerSignUpInput {
  name: string;
  email: string;
  password: string;
  companyName: string;
  companySize: string;
}

export interface EmployerSignUpResult {
  /** A session exists immediately (email confirmation is OFF in the project). */
  session: boolean;
  /** True when Supabase created the user but is waiting on email confirmation. */
  needsConfirmation: boolean;
}

/**
 * Create an employer account and their company, then grant access immediately.
 * The handle_new_user trigger provisions the company from the sign-up metadata;
 * we also ensure it client-side so this works even before the updated trigger is
 * deployed (older schema). No-ops safely into an error if Supabase is off.
 */
export async function signUpEmployer(input: EmployerSignUpInput): Promise<EmployerSignUpResult> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase isn't configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local.");
  }
  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        name: input.name.trim(),
        user_type: "company",
        company_name: input.companyName.trim(),
        company_size: input.companySize,
      },
    },
  });
  if (error) throw error;
  // With email confirmation off a session exists right away, so finish setup.
  if (data.session) {
    await ensureEmployerCompany(input.companyName.trim(), input.companySize);
  }
  return { session: !!data.session, needsConfirmation: !data.session && !!data.user };
}

/**
 * Make sure the signed-in employer is marked as a company and owns their
 * company. Idempotent: if the trigger already created the company, this finds it
 * and does nothing. Used as a fallback path for signUpEmployer.
 */
export async function ensureEmployerCompany(companyName: string, companySize: string): Promise<Company | null> {
  if (!isSupabaseConfigured) return null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  // Best-effort: flag the profile as an employer account.
  await supabase.from("profiles").update({ user_type: "company" }).eq("id", uid);
  const existing = await getMyCompany();
  if (existing) return existing;
  const { data, error } = await supabase
    .from("companies")
    .insert({ owner_id: uid, name: companyName, size: companySize, stage: sizeToStage(companySize) })
    .select("id,name,initials")
    .single();
  if (error || !data) return null;
  return data as Company;
}

export interface Role {
  id: string;
  title: string;
  location: string | null;
  type: string | null;
  tags: string[];
  package: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

// Fields written when an employer posts a new role. `type` is a work_type enum
// in the DB ('Full-time' | 'Hybrid' | 'Remote').
export interface NewRoleInput {
  title: string;
  location?: string | null;
  type?: string;
  tags?: string[];
  package?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
}

const ROLE_COLS = "id,title,location,type,tags,package,salary_min,salary_max";

function mapRole(r: Record<string, unknown>): Role {
  return {
    id: r.id as string,
    title: (r.title as string) ?? "Open Role",
    location: (r.location as string | null) ?? null,
    type: (r.type as string | null) ?? null,
    tags: (r.tags as string[] | null) ?? [],
    package: (r.package as string | null) ?? null,
    salaryMin: (r.salary_min as number | null) ?? null,
    salaryMax: (r.salary_max as number | null) ?? null,
  };
}

/** Open roles posted by a company, oldest first. Readable via the roles RLS. */
export async function getCompanyRoles(companyId: string): Promise<Role[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("roles")
    .select(ROLE_COLS)
    .eq("company_id", companyId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map(mapRole);
}

/**
 * Post a new job opening for the caller's company. Requires the "roles manage"
 * RLS policy (company owner). Returns the created role, or throws on failure.
 */
export async function createRole(companyId: string, input: NewRoleInput): Promise<Role> {
  if (!isSupabaseConfigured) throw new Error("Supabase is not configured");
  const { data, error } = await supabase
    .from("roles")
    .insert({
      company_id: companyId,
      title: input.title,
      location: input.location ?? null,
      type: input.type ?? "Full-time",
      tags: input.tags ?? [],
      package: input.package ?? null,
      salary_min: input.salaryMin ?? null,
      salary_max: input.salaryMax ?? null,
    })
    .select(ROLE_COLS)
    .single();
  if (error || !data) throw error ?? new Error("Failed to create role");
  return mapRole(data as Record<string, unknown>);
}

/** Candidates matched to the caller's company (for the Hiring board). */
export async function getCompanyMatches(): Promise<MatchedCandidate[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc("get_company_matches");
  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((r) => ({
    matchId: r.match_id as string,
    candidateId: r.candidate_id as string,
    name: (r.name as string) ?? "Candidate",
    initials: (r.initials as string) ?? "•",
    trait: (r.trait as AnimalTrait | null) ?? null,
    score: (r.score as number) ?? 0,
    stage: ((r.stage as HireStage) ?? "Applied") as HireStage,
    headline: (r.headline as string | null) ?? null,
    role: (r.role as string | null) ?? null,
  }));
}

// ---------------------------------------------------------------------------
// CANDIDATE DOSSIER — the employer reviews a matched candidate's profile,
// resume, and cover letter from the Hiring board. Profiles are readable to any
// authenticated user; resume rows + Storage files are gated by the
// "resumes/resume files employer read" policies (a company owner may read the
// files of candidates matched to a company they own). See supabase/schema.sql.
// ---------------------------------------------------------------------------

export interface CandidateExperience {
  id: string;
  title: string;
  company: string;
  dates: string;
  description: string;
}

export interface CandidateEducation {
  id: string;
  school: string;
  degree: string;
  grade: string;
  dates: string;
}

export interface CandidateDetail {
  id: string;
  name: string;
  initials: string;
  headline: string | null;
  location: string | null;
  yearsExp: number;
  about: string | null;
  skills: string[];
  experience: CandidateExperience[];
  education: CandidateEducation[];
  animalTrait: string | null;
  profileScore: number;
}

/** Full profile of a candidate (for the dossier). Returns null if unavailable. */
export async function getCandidateProfile(candidateId: string): Promise<CandidateDetail | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("id,name,initials,headline,location,years_exp,about,skills,experience,education,animal_trait,profile_score")
    .eq("id", candidateId)
    .maybeSingle();
  if (error || !data) return null;
  const r = data as Record<string, unknown>;
  return {
    id: String(r.id),
    name: (r.name as string) ?? "Candidate",
    initials: (r.initials as string) ?? "•",
    headline: (r.headline as string | null) ?? null,
    location: (r.location as string | null) ?? null,
    yearsExp: (r.years_exp as number) ?? 0,
    about: (r.about as string | null) ?? null,
    skills: (r.skills as string[] | null) ?? [],
    experience: (r.experience as CandidateExperience[] | null) ?? [],
    education: (r.education as CandidateEducation[] | null) ?? [],
    animalTrait: (r.animal_trait as string | null) ?? null,
    profileScore: (r.profile_score as number) ?? 0,
  };
}

export interface CandidateResume {
  id: string;
  title: string;
  kind: "ai" | "uploaded";
  atsScore: number;
  sizeKb: number;
  /** Storage path for uploaded files; null for AI-generated resumes (no file). */
  storagePath: string | null;
  date: string;
}

/** Resumes a matched candidate has, newest first (metadata only). */
export async function getCandidateResumes(candidateId: string): Promise<CandidateResume[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from("resumes")
    .select("id,title,label,kind,ats_score,size_kb,storage_path,created_at")
    .eq("user_id", candidateId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    title: (r.title as string) ?? (r.label as string) ?? "Resume",
    kind: ((r.kind as string) ?? "uploaded") as "ai" | "uploaded",
    atsScore: (r.ats_score as number) ?? 0,
    sizeKb: (r.size_kb as number) ?? 0,
    storagePath: (r.storage_path as string | null) ?? null,
    date: r.created_at
      ? new Date(r.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "",
  }));
}

export interface CandidateFile {
  name: string;
  path: string;
}

/**
 * Cover letters a matched candidate uploaded. Cover letters have no metadata
 * row (see uploadCoverLetter), so we list the candidate's `cover-letters` folder
 * in Storage directly. Requires the employer Storage read policy.
 */
export async function getCandidateCoverLetters(candidateId: string): Promise<CandidateFile[]> {
  if (!isSupabaseConfigured) return [];
  const folder = `${candidateId}/cover-letters`;
  const { data, error } = await supabase.storage.from("resumes").list(folder, { limit: 100 });
  if (error || !data) return [];
  return data
    .filter((f) => f.name && f.name !== ".emptyFolderPlaceholder")
    .map((f) => ({ name: f.name, path: `${folder}/${f.name}` }));
}

/**
 * A short-lived signed URL to view/download a resume or cover-letter file from
 * the private `resumes` bucket. Access is enforced by Storage RLS.
 */
export async function getResumeFileUrl(storagePath: string): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.storage.from("resumes").createSignedUrl(storagePath, 3600);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Move a matched candidate to a new hiring stage. Persisted via RLS. */
export async function setMatchStage(matchId: string, stage: HireStage): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase.from("matches").update({ stage }).eq("id", matchId);
  if (error) throw error;
}

/**
 * Live-subscribe to the caller's company matches. Fires `onChange` whenever a
 * row in `matches` for this company is inserted/updated/deleted (a candidate
 * newly matches, or a stage moves elsewhere), so the Hiring board can re-fetch
 * the enriched list. Returns an unsubscribe function; a no-op when Supabase is
 * off. Realtime is enabled on `matches` in schema.sql and RLS still applies.
 */
export function subscribeCompanyMatches(companyId: string, onChange: () => void): () => void {
  if (!isSupabaseConfigured) return () => {};
  const channel = supabase
    .channel(`company-matches-${companyId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "matches", filter: `company_id=eq.${companyId}` },
      () => onChange(),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
