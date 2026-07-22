"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, Zap, X, Check, Heart, Sparkles, Upload, Lock, Loader2, FilePlus } from "lucide-react";
import { getResumes, getSwipeDeck, recordSwipe, uploadResume, type SwipeCompany, type SwipeDirection } from "@/lib/candidate";

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
  const router = useRouter();
  const [deck, setDeck] = useState<SwipeCompany[]>([]);
  const [index, setIndex] = useState(0);
  const [matched, setMatched] = useState(0);
  const [leaving, setLeaving] = useState<null | SwipeDirection>(null);
  const [toast, setToast] = useState<string | null>(null);
  // Candidates can see the job card, but can only swipe to MATCH once they've
  // uploaded a resume (done right on the card). null = still checking.
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const focusApplied = useRef(false);

  useEffect(() => {
    getResumes().then((rs) => setHasResume(rs.some((r) => r.kind === "uploaded")));
  }, []);

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
    // Match (right-swipe) is locked until a resume is uploaded; Pass is free.
    if (dir === "right" && !hasResume) {
      showToast("Upload your resume on the card to match.");
      return;
    }
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

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploading(true);
    try {
      await uploadResume(file);
      setHasResume(true);
      showToast("Resume uploaded — you can match now.");
    } catch {
      showToast("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const canMatch = hasResume === true;

  return (
    <div className="max-w-[560px] mx-auto">
      <header className="mb-5">
        <h1 className="font-serif text-[28px] font-bold text-ink">Job Match</h1>
        <p className="eyebrow mt-2">
          {Math.max(0, remaining)} {remaining === 1 ? "job" : "jobs"} waiting · {matched} matched
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
              hasResume={canMatch}
              uploading={uploading}
              onUpload={() => fileRef.current?.click()}
              onCreateNew={() => router.push("/candidate/resume")}
              onCreateResume={(c) => showToast(`Tailor a new resume for ${c.role} at ${c.name}.`)}
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

      {/* Hidden picker used by the on-card Upload Resume button. */}
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={onPickFile} />

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
            <button
              onClick={() => swipe("right")}
              title={canMatch ? "Match" : "Upload your resume on the card to match"}
              className={`w-16 h-16 rounded-full flex items-center justify-center border transition-colors ${
                canMatch ? "bg-surface2 border-ok/45 text-ok hover:bg-ok/10" : "bg-surface2 border-line text-mut"
              }`}
            >
              {canMatch ? <Check size={26} /> : <Lock size={22} />}
            </button>
            <span className="eyebrow">{canMatch ? "Match" : "Locked"}</span>
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
  c, hasResume, uploading, onUpload, onCreateNew, onCreateResume,
}: {
  c: SwipeCompany;
  hasResume: boolean;
  uploading: boolean;
  onUpload: () => void;
  onCreateNew: () => void;
  onCreateResume: (c: SwipeCompany) => void;
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

      {hasResume ? (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3 text-[#8fd6a0] text-[12px]">
            <Check size={14} /> Resume attached — swipe right to match
          </div>
          <button onClick={() => onCreateResume(c)} className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[10.5px] tracking-wide uppercase text-goldbright" style={{ backgroundColor: "rgba(216,180,90,0.16)", border: "1px solid rgba(216,180,90,0.45)" }}>
            <Sparkles size={14} /> Create Specific Resume
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center gap-2 mb-3 text-[#e0c072] text-[12px]">
            <Lock size={13} /> Upload your resume to unlock matching
          </div>
          <div className="flex gap-3">
            <button
              onClick={onUpload}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[11px] tracking-wide uppercase disabled:opacity-60"
              style={{ backgroundColor: "rgba(216,180,90,0.9)", color: "#2b2106" }}
            >
              {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><Upload size={15} /> Upload Resume</>}
            </button>
            <button
              onClick={onCreateNew}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[11px] tracking-wide uppercase text-goldbright"
              style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(216,180,90,0.45)" }}
            >
              <FilePlus size={15} /> Create Resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
