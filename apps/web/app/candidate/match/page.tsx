"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users, Zap, X, Check, Heart, Sparkles, Upload, Lock, Loader2, FilePlus, LayoutList, FileText, Eye, ChevronDown, ChevronUp, Briefcase } from "lucide-react";
import { getResumes, getSwipeDeck, recordSwipe, uploadCoverLetter, uploadResume, type SwipeCompany, type SwipeDirection } from "@/lib/candidate";

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
  // Cover letter is optional — candidates may attach one or skip it entirely.
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  // Per-job salary the candidate fills in on the card (keyed by job id).
  const [salary, setSalary] = useState<Record<string, { expected: string; lastDrawn: string }>>({});
  const [browseOpen, setBrowseOpen] = useState(false);
  // Nudge shown when a candidate tries to match with only a resume — no cover
  // letter and/or salary details — since complete applications get seen more.
  const [showBoost, setShowBoost] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);
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
            // Match the specific job by its title first (the deck is role-based),
            // falling back to the company name, then to a synthesized card.
            const wantRole = (focus.role ?? "").toLowerCase();
            const i = d.findIndex(
              (c) => (wantRole && c.role.toLowerCase() === wantRole) || c.name.toLowerCase() === focus.name.toLowerCase(),
            );
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

  const cardSalary = (card && salary[card.id]) || { expected: "", lastDrawn: "" };

  function setCardSalary(id: string, field: "expected" | "lastDrawn", value: string) {
    // Keep only digits so the value maps cleanly to the integer salary columns.
    const digits = value.replace(/[^\d]/g, "");
    setSalary((prev) => {
      const cur = prev[id] ?? { expected: "", lastDrawn: "" };
      return { ...prev, [id]: { ...cur, [field]: digits } };
    });
  }

  // A match is "complete" once the candidate has attached a cover letter AND
  // filled in both salary fields — not just a resume. Incomplete matches still
  // work, but we nudge first (see swipe → showBoost).
  const detailsComplete = !!coverLetter && !!cardSalary.expected && !!cardSalary.lastDrawn;

  function performSwipe(dir: SwipeDirection) {
    if (!card) return;
    const s = salary[card.id];
    recordSwipe(card.id, dir, {
      expectedSalary: s?.expected ? Number(s.expected) : null,
      lastDrawnSalary: s?.lastDrawn ? Number(s.lastDrawn) : null,
    });
    if (dir === "right") setMatched((m) => m + 1);
    setLeaving(dir);
    setTimeout(() => {
      setIndex((i) => i + 1);
      setLeaving(null);
    }, 260);
  }

  function swipe(dir: SwipeDirection) {
    if (!card || leaving) return;
    // Match (right-swipe) is locked until a resume is uploaded; Pass is free.
    if (dir === "right" && !hasResume) {
      showToast("Upload your resume on the card to match.");
      return;
    }
    // Only a resume so far — nudge the candidate to add a cover letter and their
    // salary details for a higher chance of employers viewing the application.
    if (dir === "right" && !detailsComplete) {
      setShowBoost(true);
      return;
    }
    performSwipe(dir);
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  // Browse-all-jobs: bring the picked job to the top of the deck (as the current
  // card) without disturbing already-swiped cards.
  function selectJob(id: string) {
    setDeck((prev) => {
      const sel = prev.find((c) => c.id === id);
      if (!sel) return prev;
      const shown = prev.slice(0, index);
      const upcoming = prev.slice(index).filter((c) => c.id !== id);
      return [...shown, sel, ...upcoming];
    });
    setLeaving(null);
    setBrowseOpen(false);
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

  async function onPickCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    setUploadingCover(true);
    try {
      const { name } = await uploadCoverLetter(file);
      setCoverLetter(name);
      showToast("Cover letter attached.");
    } catch {
      showToast("Cover letter upload failed. Please try again.");
    } finally {
      setUploadingCover(false);
    }
  }

  const canMatch = hasResume === true;

  return (
    <div className="max-w-[560px] mx-auto">
      <header className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[28px] font-bold text-ink">Job Match</h1>
          <p className="eyebrow mt-2">
            {Math.max(0, remaining)} {remaining === 1 ? "job" : "jobs"} waiting · {matched} matched
          </p>
        </div>
        <button
          onClick={() => setBrowseOpen(true)}
          className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-medium hover:text-ink hover:border-line2"
        >
          <LayoutList size={16} /> All Jobs
        </button>
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
              coverLetter={coverLetter}
              uploadingCover={uploadingCover}
              expectedSalary={cardSalary.expected}
              lastDrawnSalary={cardSalary.lastDrawn}
              onSalaryChange={(field, value) => setCardSalary(card.id, field, value)}
              onUploadCover={() => coverRef.current?.click()}
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

      {/* Hidden pickers used by the on-card Upload Resume / Cover Letter buttons. */}
      <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={onPickFile} />
      <input ref={coverRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={onPickCover} />

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

      {/* Boost-your-chances nudge — shown when matching with only a resume. */}
      {showBoost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowBoost(false)}
        >
          <div className="w-full max-w-[430px] bg-bg border border-line rounded-[24px] p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-[58px] h-[58px] rounded-full flex items-center justify-center bg-gold/[0.12] border border-gold/40">
                <Eye size={26} className="text-gold" />
              </div>
              <h2 className="font-serif text-[23px] font-bold text-ink mt-4 leading-[29px]">Boost your chances of being seen</h2>
              <p className="text-dim text-[14px] mt-3 leading-[22px]">
                You&apos;ve only attached a resume. Applications that also include a{" "}
                <span className="text-gold font-semibold">cover letter and your salary details</span> get a higher chance of employers viewing them. Add them before you match to stand out.
              </p>
              <ul className="w-full mt-4 flex flex-col gap-2">
                <li className="flex items-center gap-2 text-[13px]">
                  {coverLetter ? <Check size={15} className="text-ok shrink-0" /> : <X size={15} className="text-mut shrink-0" />}
                  <span className={coverLetter ? "text-dim" : "text-ink"}>Cover letter {coverLetter ? "attached" : "not added"}</span>
                </li>
                <li className="flex items-center gap-2 text-[13px]">
                  {cardSalary.expected && cardSalary.lastDrawn ? <Check size={15} className="text-ok shrink-0" /> : <X size={15} className="text-mut shrink-0" />}
                  <span className={cardSalary.expected && cardSalary.lastDrawn ? "text-dim" : "text-ink"}>Expected &amp; last drawn salary {cardSalary.expected && cardSalary.lastDrawn ? "filled in" : "incomplete"}</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => setShowBoost(false)}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl py-[14px] font-semibold text-[14.5px]"
              style={{ color: "#2b2106" }}
            >
              Add cover letter &amp; details
            </button>
            <button
              onClick={() => {
                setShowBoost(false);
                performSwipe("right");
              }}
              className="mt-3 w-full py-[13px] text-dim text-[14px] font-medium rounded-xl border border-line hover:text-ink"
            >
              Match anyway
            </button>
          </div>
        </div>
      )}

      {/* Browse all jobs — pick one to bring it to the front of the deck. */}
      {browseOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/60" onClick={() => setBrowseOpen(false)}>
          <div className="w-full max-w-[520px] mt-16 bg-bgtop border border-line rounded-2xl p-6 max-h-[75vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[20px] font-bold text-ink">All Jobs</h3>
              <button onClick={() => setBrowseOpen(false)} className="text-mut hover:text-ink"><X size={20} /></button>
            </div>
            {deck.slice(index).length === 0 ? (
              <p className="text-dim text-[14px] py-8 text-center">No jobs left to review.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {deck.slice(index).map((c) => {
                  const isCurrent = c.id === card?.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => selectJob(c.id)}
                      className={`flex items-center gap-3 rounded-xl p-3 border text-left transition-colors ${
                        isCurrent ? "border-gold bg-gold/[0.06]" : "border-line bg-surface2 hover:border-line2"
                      }`}
                    >
                      <div className="w-11 h-11 rounded-lg flex items-center justify-center bg-gold/15 border border-gold/30 font-serif text-[14px] text-goldbright shrink-0">
                        {c.initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-ink text-[14px] font-semibold truncate">{c.role || "Open Role"}</div>
                        <div className="text-dim text-[12.5px] truncate">{c.name}{c.location ? ` · ${c.location}` : ""}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-gold text-[12.5px] font-semibold">{c.package || "—"}</div>
                        <div className="text-mut text-[11.5px]">{c.match}% match</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CompanyCard({
  c, hasResume, uploading, coverLetter, uploadingCover, expectedSalary, lastDrawnSalary, onSalaryChange, onUploadCover, onUpload, onCreateNew, onCreateResume,
}: {
  c: SwipeCompany;
  hasResume: boolean;
  uploading: boolean;
  coverLetter: string | null;
  uploadingCover: boolean;
  expectedSalary: string;
  lastDrawnSalary: string;
  onSalaryChange: (field: "expected" | "lastDrawn", value: string) => void;
  onUploadCover: () => void;
  onUpload: () => void;
  onCreateNew: () => void;
  onCreateResume: (c: SwipeCompany) => void;
}) {
  // Show typed digits grouped with thousands separators; store stays digit-only.
  const fmt = (v: string) => (v ? Number(v).toLocaleString("en-US") : "");
  const [showDetails, setShowDetails] = useState(false);
  const hasDetails =
    !!c.description || (c.responsibilities?.length ?? 0) > 0 || (c.requirements?.length ?? 0) > 0 || !!c.education;
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

      {(c.experienceLevel || hasDetails) && (
        <div className="mt-4">
          {c.experienceLevel && (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-[6px] text-[#cfe6d2] text-[11.5px]" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
              <Briefcase size={12} /> {c.experienceLevel} level
            </span>
          )}
          {hasDetails && (
            <>
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="flex items-center gap-1 mt-3 text-goldbright text-[12.5px] font-semibold"
              >
                {showDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />} {showDetails ? "Hide role details" : "View role details"}
              </button>
              {showDetails && (
                <div className="mt-3 rounded-2xl p-4 flex flex-col gap-3" style={{ backgroundColor: "rgba(0,0,0,0.22)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {c.description && <p className="text-[#cfe6d2] text-[12.5px] leading-[19px] whitespace-pre-line">{c.description}</p>}
                  {(c.responsibilities?.length ?? 0) > 0 && (
                    <div>
                      <div className="font-mono text-[9px] tracking-widest text-[#9dc4a4] uppercase mb-1.5">Responsibilities</div>
                      <ul className="flex flex-col gap-1">
                        {c.responsibilities!.map((x, i) => (
                          <li key={i} className="flex gap-2 text-[#cfe6d2] text-[12.5px]"><span className="text-goldbright">•</span> {x}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(c.requirements?.length ?? 0) > 0 && (
                    <div>
                      <div className="font-mono text-[9px] tracking-widest text-[#9dc4a4] uppercase mb-1.5">Requirements</div>
                      <ul className="flex flex-col gap-1">
                        {c.requirements!.map((x, i) => (
                          <li key={i} className="flex gap-2 text-[#cfe6d2] text-[12.5px]"><span className="text-goldbright">•</span> {x}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {c.education && (
                    <div>
                      <div className="font-mono text-[9px] tracking-widest text-[#9dc4a4] uppercase mb-1">Education</div>
                      <div className="text-[#cfe6d2] text-[12.5px]">{c.education}</div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
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

      {/* Salary details the candidate fills in for this job (optional). */}
      <div className="flex gap-3 mt-4">
        <label className="flex-1">
          <span className="block font-mono text-[9px] tracking-widest text-[#9dc4a4] uppercase mb-[6px]">Expected Salary</span>
          <div className="flex items-center rounded-xl px-3" style={{ backgroundColor: "rgba(0,0,0,0.22)", border: "1px solid rgba(216,180,90,0.25)" }}>
            <span className="text-[#9dc4a4] text-[13px] mr-1">$</span>
            <input
              inputMode="numeric"
              value={fmt(expectedSalary)}
              onChange={(e) => onSalaryChange("expected", e.target.value)}
              placeholder="e.g. 120,000"
              className="w-full bg-transparent py-[10px] text-ink text-[14px] outline-none placeholder:text-[#6f9277]"
            />
          </div>
        </label>
        <label className="flex-1">
          <span className="block font-mono text-[9px] tracking-widest text-[#9dc4a4] uppercase mb-[6px]">Last Drawn Salary</span>
          <div className="flex items-center rounded-xl px-3" style={{ backgroundColor: "rgba(0,0,0,0.22)", border: "1px solid rgba(216,180,90,0.25)" }}>
            <span className="text-[#9dc4a4] text-[13px] mr-1">$</span>
            <input
              inputMode="numeric"
              value={fmt(lastDrawnSalary)}
              onChange={(e) => onSalaryChange("lastDrawn", e.target.value)}
              placeholder="e.g. 98,000"
              className="w-full bg-transparent py-[10px] text-ink text-[14px] outline-none placeholder:text-[#6f9277]"
            />
          </div>
        </label>
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

      {/* Optional cover letter — candidates may attach one or skip it. */}
      <div className="mt-3">
        {coverLetter ? (
          <div className="flex items-center justify-between gap-2 rounded-xl px-4 py-3" style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(216,180,90,0.3)" }}>
            <span className="flex items-center gap-2 text-[#8fd6a0] text-[12px] min-w-0">
              <Check size={14} className="shrink-0" /> <span className="truncate">Cover letter attached · {coverLetter}</span>
            </span>
            <button onClick={onUploadCover} disabled={uploadingCover} className="text-[#cfe6d2] text-[11px] underline underline-offset-2 hover:text-ink shrink-0 disabled:opacity-60">
              Replace
            </button>
          </div>
        ) : (
          <button
            onClick={onUploadCover}
            disabled={uploadingCover}
            className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-mono text-[10.5px] tracking-wide uppercase text-[#cfe6d2] disabled:opacity-60"
            style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.14)" }}
          >
            {uploadingCover ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><FileText size={14} /> Add Cover Letter</>}
          </button>
        )}
      </div>
    </div>
  );
}
