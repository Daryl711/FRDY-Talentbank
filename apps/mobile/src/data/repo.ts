import AsyncStorage from "@react-native-async-storage/async-storage";
import { File } from "expo-file-system";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import * as mock from "./mock";
import { AnimalTrait, PersonaScores } from "./persona";
import { Connection, DirectMessage, Profile, Resume, Role, SubmittedJob, SwipeCompany, SwipeDirection } from "./types";

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
    target_type: "role",
    direction,
  });
  // Right-swiping a role creates a match on its company via a DB trigger.
}

// Jobs the signed-in candidate has applied to (right-swiped), newest first.
// Reads the get_my_submitted_jobs RPC; falls back to demo data when Supabase
// isn't configured.
export async function getSubmittedJobs(): Promise<SubmittedJob[]> {
  if (!isSupabaseConfigured) return mock.submittedJobs;
  const { data, error } = await supabase.rpc("get_my_submitted_jobs");
  if (error || !data) return mock.submittedJobs;
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
  if (!isSupabaseConfigured) return mock.connections.filter((c) => c.kind === kind);
  const { data, error } = await supabase
    .from("connections_view")
    .select("*")
    .eq("kind", kind);
  if (error || !data) return mock.connections.filter((c) => c.kind === kind);
  return data as unknown as Connection[];
}

// ---------------------------------------------------------------------------
// PEER CONNECTIONS — candidates add other candidates from Discover, accept the
// requests they receive, and DM each other. Requests + messages stream over
// Supabase Realtime (see subscribeConnections / subscribeMessages below).
// ---------------------------------------------------------------------------

async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/**
 * Send a connection request to another candidate (I'm the requester). Returns
 * the new connection row's id so the caller can open a chat immediately.
 * No-op-safe in mock mode, where it returns a synthetic id.
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
  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId);
  if (error) throw error;
}

/** Decline a pending request. */
export async function declineConnection(connectionId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from("connections")
    .update({ status: "declined" })
    .eq("id", connectionId);
  if (error) throw error;
}

/** How many pending requests are waiting on me (the live Requests badge). */
export async function getRequestCount(): Promise<number> {
  if (!isSupabaseConfigured) return mock.connections.filter((c) => c.kind === "requests").length;
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

// ---------------------------------------------------------------------------
// RESUMES — AI-generated and uploaded documents with ATS scores.
// ---------------------------------------------------------------------------

// Supabase stores resumes in snake_case (size_kb, ats_score, created_at…); the
// app's Resume type is camelCase. Map DB rows so the UI reads the right fields
// whether they came from an insert or a fetch.
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
  if (!isSupabaseConfigured) return mock.resumes;
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return mock.resumes;
  const { data, error } = await supabase
    .from("resumes")
    .select("*")
    .eq("user_id", uid)
    .order("created_at", { ascending: false });
  if (error || !data) return mock.resumes;
  return (data as Record<string, unknown>[]).map(rowToResume);
}

/**
 * Create a role-targeted AI resume. In the prototype this synthesizes a record
 * locally (and a plausible ATS score). In production, route through a Supabase
 * Edge Function that calls Claude to tailor the resume, then insert the row.
 */
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
        .insert({
          user_id: uid,
          title: resume.title,
          kind: "ai",
          for_company: resume.forCompany,
          size_kb: resume.sizeKb,
          ats_score: resume.atsScore,
        })
        .select()
        .single();
      if (data) return rowToResume(data as Record<string, unknown>);
    }
  }
  return resume;
}

/** A file the user picked to upload (from expo-document-picker). */
export interface ResumeUpload {
  name: string;
  uri: string;
  /** File size in bytes, if the picker reported it. */
  sizeBytes?: number;
  mimeType?: string;
}

/**
 * Upload a resume file the user picked from their device. When Supabase is
 * configured the file bytes are stored in the `resumes` Storage bucket (under
 * the user's own folder) and a metadata row is inserted into the resumes table.
 * Without Supabase, a local record is returned so the prototype still works.
 */
export async function uploadResume(input: ResumeUpload): Promise<Resume> {
  const sizeKb = input.sizeBytes ? Math.max(1, Math.round(input.sizeBytes / 1024)) : 0;
  // Uploaded files get a baseline ATS estimate; real parsing would run server-side.
  const atsScore = 68 + Math.floor(Math.random() * 20); // 68–87
  const title = input.name.replace(/\.[^./\\]+$/, ""); // drop the file extension for display
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

  // Push the picked file's bytes to Storage. Path is namespaced by user id so
  // the "resumes" bucket policy can scope each user to their own folder.
  const bytes = await new File(input.uri).bytes();
  const storagePath = `${uid}/${Date.now()}_${input.name}`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, bytes, {
      contentType: input.mimeType || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("resumes")
    .insert({
      user_id: uid,
      title,
      label: title,
      kind: "uploaded",
      storage_path: storagePath,
      size_kb: sizeKb,
      ats_score: atsScore,
    })
    .select()
    .single();
  if (error) throw error;
  return data ? rowToResume(data as Record<string, unknown>) : resume;
}

export const trendingSectors = mock.trendingSectors;
export const careerInsights = mock.careerInsights;
