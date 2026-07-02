import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as mock from "./mock";
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

export const trendingSectors = mock.trendingSectors;
export const careerInsights = mock.careerInsights;
