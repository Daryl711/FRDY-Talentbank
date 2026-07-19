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
