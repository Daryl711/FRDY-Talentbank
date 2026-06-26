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

export const trendingSectors = mock.trendingSectors;
export const careerInsights = mock.careerInsights;
