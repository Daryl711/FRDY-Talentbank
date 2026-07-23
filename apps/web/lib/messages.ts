// Company-match messaging — the chat thread between a candidate and the employer
// whose role they applied to. Both portals (candidate Applications, employer
// Hiring board) use these helpers, so they live in one shared module rather than
// being duplicated across lib/candidate.ts and lib/employer.ts.
//
// A message is keyed to a `matches` row (messages.match_id). The candidate is
// matches.user_id; the employer is the owner of matches.company_id. RLS
// ("messages read" / "messages send" in supabase/schema.sql) lets exactly those
// two participants read and post, and Realtime streams inserts to both.

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

/** A message on a candidate ↔ employer company-match thread. */
export interface MatchMessage {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** True when the signed-in user sent this message. */
  mine: boolean;
}

// In-memory threads so the chat UI is demoable when Supabase isn't configured.
const mockThreads: Record<string, MatchMessage[]> = {};

async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

function mapRow(r: Record<string, unknown>, uid: string | null): MatchMessage {
  return {
    id: String(r.id),
    match_id: String(r.match_id),
    sender_id: String(r.sender_id),
    body: String(r.body),
    created_at: String(r.created_at),
    mine: r.sender_id === uid,
  };
}

/** Full message history for a match thread, oldest first. */
export async function getMatchMessages(matchId: string): Promise<MatchMessage[]> {
  if (!isSupabaseConfigured) return mockThreads[matchId] ?? [];
  const uid = await currentUid();
  const { data, error } = await supabase
    .from("messages")
    .select("id, match_id, sender_id, body, created_at")
    .eq("match_id", matchId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as Record<string, unknown>[]).map((r) => mapRow(r, uid));
}

/** Send a message on a match thread. Returns the stored row. */
export async function sendMatchMessage(matchId: string, body: string): Promise<MatchMessage | null> {
  const text = body.trim();
  if (!text) return null;
  if (!isSupabaseConfigured) {
    const msg: MatchMessage = {
      id: `mock_msg_${Date.now()}`,
      match_id: matchId,
      sender_id: "me",
      body: text,
      created_at: new Date().toISOString(),
      mine: true,
    };
    (mockThreads[matchId] ??= []).push(msg);
    return msg;
  }
  const uid = await currentUid();
  if (!uid) return null;
  const { data, error } = await supabase
    .from("messages")
    .insert({ match_id: matchId, sender_id: uid, body: text })
    .select("id, match_id, sender_id, body, created_at")
    .single();
  if (error) throw error;
  return mapRow(data as Record<string, unknown>, uid);
}

/**
 * Live-subscribe to new messages on a match thread. `onInsert` receives each new
 * message (already tagged `mine`). Returns an unsubscribe function; a no-op when
 * Supabase is off. Realtime is enabled on `messages` in schema.sql; RLS still
 * applies so only the two participants receive rows.
 */
export function subscribeMatchMessages(
  matchId: string,
  onInsert: (msg: MatchMessage) => void,
): () => void {
  if (!isSupabaseConfigured) return () => {};
  let uid: string | null = null;
  currentUid().then((id) => (uid = id));
  const channel = supabase
    .channel(`match-messages-${matchId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
      (payload) => onInsert(mapRow(payload.new as Record<string, unknown>, uid)),
    )
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}
