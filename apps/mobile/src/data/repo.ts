import AsyncStorage from "@react-native-async-storage/async-storage";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as mock from "./mock";
import { AnimalTrait, PersonaScores } from "./persona";
import { Connection, Profile, Role, SwipeCompany, SwipeDirection } from "./types";

// Each function tries Supabase when configured, otherwise returns local mock
// data. This lets the app run immediately, and become live the moment you add
// EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY to .env and run supabase/schema.sql.

export async function getMyProfile(): Promise<Profile> {
  if (!isSupabaseConfigured) return mock.me;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mock.me;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", uid).single();
  if (error || !data) return mock.me;
  return data as unknown as Profile;
}

// Persist edits to the signed-in user's profile. Only the passed fields are
// written; returns the updated row so callers can refresh their state.
export async function updateMyProfile(patch: Partial<Profile>): Promise<Profile | null> {
  if (!isSupabaseConfigured) return null;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", uid)
    .select("*")
    .single();
  if (error) throw error;
  return data as unknown as Profile;
}

export async function getFeaturedRoles(): Promise<Role[]> {
  if (!isSupabaseConfigured) return mock.featuredRoles;
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("match", { ascending: false })
    .limit(10);
  if (error || !data) return mock.featuredRoles;
  return data as unknown as Role[];
}

export async function getSwipeDeck(): Promise<SwipeCompany[]> {
  if (!isSupabaseConfigured) return mock.swipeDeck;
  // Companies the user hasn't swiped on yet, ranked by compatibility score.
  const { data, error } = await supabase.rpc("get_swipe_deck");
  if (error || !data) return mock.swipeDeck;
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
    target_type: "company",
    direction,
  });
  // A mutual match (both sides swiped right) is created by a DB trigger.
}

export async function getConnections(kind: Connection["kind"]): Promise<Connection[]> {
  if (!isSupabaseConfigured) return mock.connections.filter((c) => c.kind === kind);
  const { data, error } = await supabase
    .from("connections_view")
    .select("*")
    .eq("kind", kind);
  if (error || !data) return mock.connections.filter((c) => c.kind === kind);
  return data as unknown as Connection[];
}

// ---------------------------------------------------------------------------
// AUTH — sign up writes a new user to Supabase, sign in reads it back.
// ---------------------------------------------------------------------------

export interface SignUpResult {
  /** A session exists immediately (email confirmation is OFF in the project). */
  session: boolean;
  /** True when Supabase created the user but is waiting on email confirmation. */
  needsConfirmation: boolean;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  name: string,
): Promise<SignUpResult> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase isn't configured. Add EXPO_PUBLIC_SUPABASE_URL and _ANON_KEY to .env.");
  }
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    // The handle_new_user trigger reads raw_user_meta_data->>'name' to seed
    // the profiles row, so pass the name through here.
    options: { data: { name: name.trim() } },
  });
  if (error) throw error;
  return {
    session: !!data.session,
    needsConfirmation: !data.session && !!data.user,
  };
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase isn't configured. Add EXPO_PUBLIC_SUPABASE_URL and _ANON_KEY to .env.");
  }
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}

// ---------------------------------------------------------------------------
// ANIMAL PERSONA — the onboarding quiz result gates entry into the app.
// Live: stored on profiles.animal_trait / animal_scores. Demo (no Supabase):
// persisted to AsyncStorage so it only blocks the first run.
// ---------------------------------------------------------------------------

const TRAIT_KEY = "mango.animal_trait";
const SCORES_KEY = "mango.animal_scores";

/** Returns the user's animal persona if they've completed the quiz, else null. */
export async function getMyAnimalTrait(): Promise<string | null> {
  if (!isSupabaseConfigured) {
    return AsyncStorage.getItem(TRAIT_KEY);
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase
    .from("profiles")
    .select("animal_trait")
    .eq("id", uid)
    .single();
  if (error || !data) return null;
  return (data as { animal_trait: string | null }).animal_trait ?? null;
}

/** Persist the quiz result. Flows to the employer dashboard's Animal Trait column. */
export async function saveMyAnimalTrait(trait: AnimalTrait, scores: PersonaScores): Promise<void> {
  if (!isSupabaseConfigured) {
    await AsyncStorage.multiSet([
      [TRAIT_KEY, trait],
      [SCORES_KEY, JSON.stringify(scores)],
    ]);
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Cannot save persona: no signed-in user.");
  // .select() so we can tell an UPDATE that matched zero rows (e.g. the profile
  // row is missing) apart from a real write — a silent no-op here is exactly what
  // caused the quiz to reappear on every sign-in.
  const { data, error } = await supabase
    .from("profiles")
    .update({ animal_trait: trait, animal_scores: scores })
    .eq("id", uid)
    .select("id");
  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Persona not saved: no profile row for this user.");
  }
}

/** Clear the saved persona (used by "Retake quiz" and for re-demoing onboarding). */
export async function resetMyAnimalTrait(): Promise<void> {
  if (!isSupabaseConfigured) {
    await AsyncStorage.multiRemove([TRAIT_KEY, SCORES_KEY]);
    return;
  }
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return;
  await supabase.from("profiles").update({ animal_trait: null }).eq("id", uid);
}

// ---------------------------------------------------------------------------
// SAVED JOBS — a candidate bookmarks roles to revisit later.
// Persisted to AsyncStorage (per device) so saves survive app reloads. Featured
// roles are demo/mock content, so we store a full Role snapshot rather than a
// foreign key — this works identically whether or not Supabase is configured.
// ---------------------------------------------------------------------------

const SAVED_JOBS_KEY = "mango.saved_jobs";

/** All roles the user has saved, most-recently-saved first. */
export async function getSavedJobs(): Promise<Role[]> {
  const raw = await AsyncStorage.getItem(SAVED_JOBS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Role[]) : [];
  } catch {
    return [];
  }
}

/** Save a role (no-op if already saved). Returns the updated saved list. */
export async function saveJob(role: Role): Promise<Role[]> {
  const current = await getSavedJobs();
  if (current.some((r) => r.id === role.id)) return current;
  const next = [role, ...current];
  await AsyncStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
  return next;
}

/** Remove a saved role. Returns the updated saved list. */
export async function unsaveJob(roleId: string): Promise<Role[]> {
  const current = await getSavedJobs();
  const next = current.filter((r) => r.id !== roleId);
  await AsyncStorage.setItem(SAVED_JOBS_KEY, JSON.stringify(next));
  return next;
}

/** Toggle a role's saved state. Returns { saved, jobs } after the change. */
export async function toggleSavedJob(role: Role): Promise<{ saved: boolean; jobs: Role[] }> {
  const current = await getSavedJobs();
  const isSaved = current.some((r) => r.id === role.id);
  const jobs = isSaved ? await unsaveJob(role.id) : await saveJob(role);
  return { saved: !isSaved, jobs };
}

export const trendingSectors = mock.trendingSectors;
export const careerInsights = mock.careerInsights;
