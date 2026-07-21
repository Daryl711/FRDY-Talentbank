"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, Users, Zap, X, Check, Heart, Sparkles, FileText } from "lucide-react";
import { getSwipeDeck, recordSwipe, type SwipeCompany, type SwipeDirection } from "@/lib/candidate";

type FocusJob = Partial<SwipeCompany> & { name: string };

function synthCompany(f: FocusJob): SwipeCompany {
  return {
    id: f.id ?? f.name,
    initials: f.initials ?? f.name.slice(0, 2).toUpperCase(),
    name: f.name,
    role: f.role ?? "",
    location: f.location ?? "",
    employees: f.employees ?? "",
    match: f.match ?? 0,
    tags: f.tags ?? [],
    package: f.package ?? "",
    perks: f.perks ?? [],
  };
}

export default function MatchPage() {
  const [deck, setDeck] = useState<SwipeCompany[]>([]);
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState(0);
  const [leaving, setLeaving] = useState<null | SwipeDirection>(null);
  const [toast, setToast] = useState<string | null>(null);
  const focusApplied = useRef(false);

  useEffect(() => {
    getSwipeDeck().then((d) => {
      // If the Home screen stashed a focus job, bring it to the top of the deck.
      let ordered = d;
      if (!focusApplied.current && typeof window !== "undefined") {
        const raw = window.sessionStorage.getItem("mango.focus_job");
        if (raw) {
          window.sessionStorage.removeItem("mango.focus_job");
          try {
            const focus = JSON.parse(raw) as FocusJob;
            const i = d.findIndex((c) => c.name.toLowerCase() === focus.name.toLowerCase());
            ordered = i >= 0 ? [d[i], ...d.slice(0, i), ...d.slice(i + 1)] : [synthCompany(focus), ...d];
          } catch {
            /* ignore malformed focus payload */
          }
        }
        focusApplied.current = true;
      }
      setDeck(ordered);
    });
  }, []);

  const card = deck[index];
  const remaining = deck.length - index;
  const done = index >= deck.length && deck.length > 0;

  function swipe(dir: SwipeDirection) {
    if (!card || leaving) return;
    recordSwipe(card.id, dir);
    if (dir === "right") setMatched((m) => m + 1);
    setLeaving(dir);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setLeaving(null);
    }, 260);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  return (
    <div className="max-w-[560px] mx-auto">
      <header className="mb-5">
        <h1 className="font-serif text-[28px] font-bold text-ink">Job Match</h1>
        <p className="eyebrow mt-2">
          {Math.max(0, remaining)} {remaining === 1 ? "company" : "companies"} waiting · {matched} matched
        </p>
      </header>

      <div className="relative min-h-[520px]">
        {card && !done ? (
          <div
            style={{
              transition: "transform 0.26s ease, opacity 0.26s ease",
              transform: leaving === "left" ? "translateX(-120%) rotate(-12deg)" : leaving === "right" ? "translateX(120%) rotate(12deg)" : "none",
              opacity: leaving ? 0 : 1,
            }}
          >
            <CompanyCard
              c={card}
              onCreateResume={(c) => showToast(`Tailor a new resume for ${c.role} at ${c.name}.`)}
              onAddResume={(c) => showToast(`Attach one of your saved resumes to ${c.name}.`)}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-24">
            <Heart size={40} className="text-gold" />
            <h2 className="font-serif text-[22px] font-bold text-ink">You&apos;re all caught up</h2>
            <p className="text-dim text-[13px]">{matched} {matched === 1 ? "match" : "matches"} made today</p>
          </div>
        )}
      </div>

      {/* actions */}
      {card && !done && (
        <div className="flex items-end justify-center gap-14 mt-6">
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => swipe("left")} className="w-16 h-16 rounded-full bg-surface2 border border-danger/45 flex items-center justify-center text-danger hover:bg-danger/10">
              <X size={26} />
            </button>
            <span className="eyebrow">Pass</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => swipe("right")} className="w-16 h-16 rounded-full bg-surface2 border border-ok/45 flex items-center justify-center text-ok hover:bg-ok/10">
              <Check size={26} />
            </button>
            <span className="eyebrow">Match</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-8 bg-surface3 border border-line2 rounded-xl px-5 py-3 text-ink text-[13px] shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

function CompanyCard({
  c, onCreateResume, onAddResume,
}: {
  c: SwipeCompany;
  onCreateResume: (c: SwipeCompany) => void;
  onAddResume: (c: SwipeCompany) => void;
}) {
  return (
    <div className="rounded-3xl p-6 border" style={{ borderColor: "#3d6b3f", background: "linear-gradient(135deg,#183a26,#0f2418)" }}>
      <div className="flex justify-between items-start">
        <div className="w-[74px] h-[74px] rounded-2xl flex items-center justify-center bg-gold/15 border border-gold/30 font-serif text-[24px] text-goldbright">
          {c.initials}
        </div>
        <span className="flex items-center gap-1 rounded-full px-3 py-[7px] bg-gold/20 border border-gold/40 font-mono text-[11px] font-bold text-goldbright">
          <Zap size={12} /> {c.match}% MATCH
        </span>
      </div>

      <h2 className="font-serif text-[28px] text-ink mt-4">{c.name}</h2>
      <p className="text-[#bfe3c4] text-[15px] mt-1">{c.role}</p>

      <div className="flex gap-5 mt-4 text-[#9dc4a4] text-[12.5px]">
        {c.location && <span className="flex items-center gap-1"><MapPin size={13} /> {c.location}</span>}
        {c.employees && <span className="flex items-center gap-1"><Users size={13} /> {c.employees}</span>}
      </div>

      {c.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {c.tags.map((t) => (
            <span key={t} className="rounded-full px-3 py-[7px] text-[#cfe6d2] text-[12px]" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {t}
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-between items-end mt-5 rounded-2xl px-4 py-4" style={{ backgroundColor: "rgba(0,0,0,0.22)", border: "1px solid rgba(216,180,90,0.18)" }}>
        <div>
          <div className="font-mono text-[9px] tracking-widest text-[#9dc4a4] uppercase">Package</div>
          <div className="font-serif text-[24px] text-goldbright mt-1">{c.package || "—"}</div>
        </div>
        <div className="flex flex-col items-end gap-[6px]">
          {c.perks.map((p) => (
            <span key={p} className="rounded-lg px-[10px] py-1 text-goldbright text-[10.5px]" style={{ backgroundColor: "rgba(216,180,90,0.12)" }}>{p}</span>
          ))}
        </div>
      </div>

      <div className="flex gap-3 mt-4">
        <button onClick={() => onCreateResume(c)} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[10.5px] tracking-wide uppercase text-goldbright" style={{ backgroundColor: "rgba(216,180,90,0.16)", border: "1px solid rgba(216,180,90,0.45)" }}>
          <Sparkles size={14} /> Create Specific Resume
        </button>
        <button onClick={() => onAddResume(c)} className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[10.5px] tracking-wide uppercase text-[#cfe6d2]" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.18)" }}>
          <FileText size={14} /> Add Existing Resume
        </button>
      </div>
    </div>
  );
}
