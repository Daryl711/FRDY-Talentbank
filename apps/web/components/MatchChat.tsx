"use client";

import { useEffect, useRef, useState } from "react";
import { X, Send, MessageCircle, Loader2 } from "lucide-react";
import {
  getMatchMessages,
  sendMatchMessage,
  subscribeMatchMessages,
  type MatchMessage,
} from "@/lib/messages";

/**
 * Real-time chat on a candidate ↔ employer company match. Shared by both
 * portals: the candidate opens it from their Applications list, the employer
 * from the Hiring board. Both talk to the same `messages.match_id` thread, so a
 * message sent on one side streams into the other over Supabase Realtime.
 *
 * The dialog is rendered only while a thread is open (matchId set), so it
 * remounts per conversation and initializes cleanly from `matchId`.
 */
export default function MatchChat({
  matchId,
  title,
  subtitle,
  initials,
  color = "#1573c4",
  onClose,
}: {
  matchId: string | null;
  title: string;
  subtitle?: string;
  initials: string;
  color?: string;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(!!matchId);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Append only if the id isn't already present (dedupes the optimistic insert
  // against the realtime echo).
  const merge = (incoming: MatchMessage) =>
    setMessages((prev) => (prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]));

  useEffect(() => {
    if (!matchId) return;
    let active = true;
    getMatchMessages(matchId).then((rows) => {
      if (active) {
        setMessages(rows);
        setLoading(false);
      }
    });
    const unsubscribe = subscribeMatchMessages(matchId, (msg) => {
      if (active) merge(msg);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [matchId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSend() {
    const text = draft.trim();
    if (!text || !matchId || sending) return;
    setDraft("");
    setSending(true);
    try {
      const saved = await sendMatchMessage(matchId, text);
      if (saved) merge(saved);
    } catch {
      setDraft(text); // restore on failure so the user doesn't lose their message
    } finally {
      setSending(false);
    }
  }

  if (!matchId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-[520px] h-[640px] max-h-[90vh] flex flex-col bg-bg border border-line rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-line">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-[14px] shrink-0" style={{ backgroundColor: color }}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[15.5px] text-ink truncate">{title}</div>
            {subtitle && <div className="text-dim text-[12.5px] truncate">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface2 border border-line text-mut hover:text-ink">
            <X size={18} />
          </button>
        </div>

        {/* messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 flex flex-col gap-[10px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-mut">
              <Loader2 size={20} className="animate-spin text-gold" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 text-dim">
              <MessageCircle size={28} className="text-mut" />
              <p className="text-[13.5px]">
                Start the conversation with {title.split(" ")[0]}.<br />Messages are private to the two of you.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m.id} className={`max-w-[78%] ${m.mine ? "self-end" : "self-start"}`}>
                <div
                  className={`px-[14px] py-[9px] rounded-2xl border text-[14.5px] ${m.mine ? "text-goldbright" : "bg-surface border-line text-ink"}`}
                  style={m.mine ? { backgroundColor: "rgba(216,180,90,0.14)", borderColor: "rgba(216,180,90,0.4)" } : undefined}
                >
                  {m.body}
                </div>
              </div>
            ))
          )}
        </div>

        {/* composer */}
        <div className="flex items-end gap-2 px-4 py-4 border-t border-line">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Write a message…"
            className="flex-1 resize-none bg-surface2 border border-line rounded-2xl px-4 py-[11px] text-ink text-[14.5px] outline-none placeholder:text-mut max-h-[120px]"
          />
          <button
            onClick={onSend}
            disabled={!draft.trim() || sending}
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-50"
            style={{ backgroundColor: "#d8b45a", color: "#3a2d08" }}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
