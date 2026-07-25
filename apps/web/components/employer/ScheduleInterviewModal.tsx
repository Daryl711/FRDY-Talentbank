"use client";

import { useState } from "react";
import { X, CalendarClock, Loader2 } from "lucide-react";
import type { InterviewMode, ScheduleInterviewInput } from "@/lib/interviews";
import type { MatchedCandidate } from "@/lib/types";

const MODES: { value: InterviewMode; label: string; placeholder: string }[] = [
  { value: "In-Person", label: "In-Person", placeholder: "Venue address, e.g. 12 Jalan Ampang, Level 8" },
  { value: "Video Call", label: "Video Call", placeholder: "Meeting link, e.g. https://meet.google.com/..." },
  { value: "Phone Call", label: "Phone Call", placeholder: "Phone number to call/expect a call from" },
];

/**
 * Opened when an employer advances a candidate from Shortlisted to Interview.
 * Collects the appointment details before the stage actually moves — the
 * parent (Hiring page) schedules the interview, moves the stage, and sends
 * the candidate an automated heads-up, in that order (see scheduleAndAdvance).
 */
export default function ScheduleInterviewModal({
  candidate,
  onClose,
  onSchedule,
}: {
  candidate: MatchedCandidate | null;
  onClose: () => void;
  onSchedule: (input: ScheduleInterviewInput) => Promise<void>;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [mode, setMode] = useState<InterviewMode>("Video Call");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!candidate) return null;

  const canSubmit = !!date && !!time;

  async function submit() {
    if (!canSubmit || busy) return;
    const scheduledAt = new Date(`${date}T${time}`);
    if (Number.isNaN(scheduledAt.getTime())) {
      setError("Enter a valid date and time.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSchedule({
        scheduledAt: scheduledAt.toISOString(),
        mode,
        location: location.trim() || null,
        notes: notes.trim() || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't schedule the interview. Please try again.");
      setBusy(false);
    }
  }

  const field =
    "w-full bg-surface2 border border-line rounded-xl px-4 py-[11px] text-ink text-[14px] outline-none placeholder:text-mut focus:border-gold/50";
  const modeConfig = MODES.find((m) => m.value === mode)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="w-full max-w-[460px] bg-bg border border-line rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-6 py-5 border-b border-line">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gold/[0.12] border border-gold/30 shrink-0">
            <CalendarClock size={18} className="text-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[18px] font-bold text-ink">Schedule Interview</div>
            <div className="text-dim text-[12.5px] truncate">
              {candidate.name}{candidate.role ? ` · ${candidate.role}` : ""}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface2 border border-line text-mut hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="eyebrow">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${field} mt-2`} />
            </div>
            <div>
              <label className="eyebrow">Time</label>
              <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={`${field} mt-2`} />
            </div>
          </div>

          <div>
            <label className="eyebrow">Mode</label>
            <div className="flex gap-2 mt-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  className={`flex-1 rounded-xl px-3 py-[10px] text-[12.5px] font-semibold border transition-colors ${
                    mode === m.value ? "border-gold bg-gold/[0.1] text-goldbright" : "border-line bg-surface2 text-dim hover:text-ink"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="eyebrow">{mode === "In-Person" ? "Venue" : mode === "Video Call" ? "Meeting Link" : "Phone Number"}</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder={modeConfig.placeholder}
              className={`${field} mt-2`}
            />
          </div>

          <div>
            <label className="eyebrow">Notes <span className="text-mut normal-case tracking-normal">(optional)</span></label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="What to bring, who they'll meet, dress code, etc."
              className={`${field} mt-2 resize-y`}
            />
          </div>

          {error && <p className="text-[13px] text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{error}</p>}

          <div className="flex items-center gap-3 mt-1">
            <button
              onClick={submit}
              disabled={!canSubmit || busy}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[12px] font-semibold text-[14px] disabled:opacity-40"
              style={{ color: "#2b2106" }}
            >
              {busy ? <><Loader2 size={16} className="animate-spin" /> Scheduling…</> : "Schedule & Advance to Interview"}
            </button>
            <button onClick={onClose} disabled={busy} className="text-mut hover:text-ink text-[13px] px-2 disabled:opacity-40">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
