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
  }));
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
