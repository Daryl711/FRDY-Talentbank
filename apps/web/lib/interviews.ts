// Interview scheduling — set by the employer when moving a candidate from
// Shortlisted to Interview, read by both portals (employer Hiring board,
// candidate Applications details). One row per match; scheduling again just
// updates it in place (a reschedule), so there's no history — only the
// current appointment. RLS ("interviews read" / "interviews manage" in
// supabase/schema.sql) scopes reads to the two match participants and writes
// to the employer who owns the company.

import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type InterviewMode = "In-Person" | "Video Call" | "Phone Call";

export interface Interview {
  id: string;
  matchId: string;
  /** ISO timestamp. */
  scheduledAt: string;
  mode: InterviewMode;
  /** Venue address, meeting link, or phone number, depending on mode. */
  location: string | null;
  notes: string | null;
}

export interface ScheduleInterviewInput {
  scheduledAt: string; // ISO timestamp
  mode: InterviewMode;
  location?: string | null;
  notes?: string | null;
}

// In-memory store so the flow is demoable when Supabase isn't configured.
const mockInterviews: Record<string, Interview> = {};

function mapRow(r: Record<string, unknown>): Interview {
  return {
    id: String(r.id),
    matchId: String(r.match_id),
    scheduledAt: String(r.scheduled_at),
    mode: ((r.mode as InterviewMode | null) ?? "In-Person") as InterviewMode,
    location: (r.location as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
  };
}

/** The scheduled interview for a match, or null if none has been set. */
export async function getInterview(matchId: string): Promise<Interview | null> {
  if (!isSupabaseConfigured) return mockInterviews[matchId] ?? null;
  const { data, error } = await supabase
    .from("interviews")
    .select("id, match_id, scheduled_at, mode, location, notes")
    .eq("match_id", matchId)
    .maybeSingle();
  if (error || !data) return null;
  return mapRow(data as Record<string, unknown>);
}

/**
 * Set (or reschedule) the interview for a match. Requires the "interviews
 * manage" RLS policy (the company that owns the match). Upserts on match_id
 * so calling this again just updates the existing appointment.
 */
export async function scheduleInterview(matchId: string, input: ScheduleInterviewInput): Promise<Interview> {
  if (!isSupabaseConfigured) {
    const interview: Interview = {
      id: `mock_interview_${matchId}`,
      matchId,
      scheduledAt: input.scheduledAt,
      mode: input.mode,
      location: input.location ?? null,
      notes: input.notes ?? null,
    };
    mockInterviews[matchId] = interview;
    return interview;
  }
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("interviews")
    .upsert(
      {
        match_id: matchId,
        scheduled_at: input.scheduledAt,
        mode: input.mode,
        location: input.location ?? null,
        notes: input.notes ?? null,
        created_by: auth.user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id" },
    )
    .select("id, match_id, scheduled_at, mode, location, notes")
    .single();
  if (error || !data) throw error ?? new Error("Failed to schedule interview");
  return mapRow(data as Record<string, unknown>);
}
