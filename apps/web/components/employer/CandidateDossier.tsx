"use client";

import { useEffect, useState } from "react";
import { X, MapPin, Briefcase, GraduationCap, FileText, FileCheck2, Download, Loader2, Sparkles, Zap } from "lucide-react";
import {
  getCandidateProfile,
  getCandidateResumes,
  getCandidateCoverLetters,
  getResumeFileUrl,
  type CandidateDetail,
  type CandidateResume,
  type CandidateFile,
} from "@/lib/employer";
import { ANIMALS, type AnimalTrait } from "@/lib/persona";
import type { MatchedCandidate } from "@/lib/types";

/**
 * Read-only dossier the employer opens from the Hiring board to review a matched
 * candidate: match score against the job, profile details, resume(s) and cover
 * letter(s). Resume/cover-letter files open via short-lived signed URLs; access
 * is gated by the employer Storage read policy (supabase/schema.sql).
 */
export default function CandidateDossier({
  candidate,
  onClose,
}: {
  candidate: MatchedCandidate | null;
  onClose: () => void;
}) {
  // Mounted fresh per candidate (parent gates + keys on candidateId), so state
  // initializes cleanly and the effect never needs a synchronous setState.
  const candidateId = candidate?.candidateId ?? null;
  const [profile, setProfile] = useState<CandidateDetail | null>(null);
  const [resumes, setResumes] = useState<CandidateResume[]>([]);
  const [covers, setCovers] = useState<CandidateFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!candidateId) return;
    let active = true;
    Promise.all([
      getCandidateProfile(candidateId),
      getCandidateResumes(candidateId),
      getCandidateCoverLetters(candidateId),
    ]).then(([p, r, c]) => {
      if (!active) return;
      setProfile(p);
      setResumes(r);
      setCovers(c);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [candidateId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function openFile(path: string) {
    setOpening(path);
    try {
      const url = await getResumeFileUrl(path);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpening(null);
    }
  }

  if (!candidate) return null;

  const trait = candidate.trait ?? profile?.animalTrait ?? null;
  const meta = trait ? ANIMALS[trait as AnimalTrait] : null;
  const scoreTone = candidate.score >= 90 ? "text-ok" : "text-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-[640px] max-h-[90vh] flex flex-col bg-bg border border-line rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-line">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold/[0.12] border border-gold/30 text-[22px] shrink-0">
            {meta?.emoji ?? "•"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[19px] font-bold text-ink truncate">{candidate.name}</div>
            <div className="text-dim text-[12.5px] truncate">
              {profile?.headline || meta?.archetype || (trait ?? "Candidate")}
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface2 border border-line text-mut hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-6">
          {/* match against the job */}
          <div className="flex items-center justify-between rounded-2xl px-5 py-4 bg-gold/[0.06] border border-gold/25">
            <div className="min-w-0">
              <div className="eyebrow flex items-center gap-1"><Briefcase size={11} /> Applied for</div>
              <div className="text-ink text-[15px] font-semibold truncate mt-[3px]">{candidate.role ?? "—"}</div>
            </div>
            <div className="text-right shrink-0 pl-4">
              <div className={`flex items-center gap-1 justify-end font-serif text-[26px] font-bold ${scoreTone}`}>
                <Zap size={16} /> {candidate.score}%
              </div>
              <div className="eyebrow">Match</div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 size={22} className="animate-spin text-gold" />
            </div>
          ) : (
            <>
              {/* details */}
              <section className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-mut text-[12.5px]">
                  {profile?.location && <span className="flex items-center gap-1"><MapPin size={12} /> {profile.location}</span>}
                  <span className="flex items-center gap-1"><Briefcase size={12} /> {profile?.yearsExp ?? 0} yrs experience</span>
                  {meta && <span className="text-gold">{meta.emoji} {meta.archetype}</span>}
                </div>
                {profile?.about && <p className="text-dim text-[13.5px] leading-[21px]">{profile.about}</p>}
                {!!profile?.skills.length && (
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s) => (
                      <span key={s} className="text-dim text-[11.5px] bg-surface2 border border-line rounded-full px-[10px] py-[4px]">{s}</span>
                    ))}
                  </div>
                )}
              </section>

              {/* experience */}
              {!!profile?.experience.length && (
                <section>
                  <h3 className="eyebrow mb-3">Experience</h3>
                  <div className="flex flex-col gap-3">
                    {profile.experience.map((e) => (
                      <div key={e.id} className="bg-surface border border-line rounded-xl p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-ink text-[14px] font-semibold">{e.title}</span>
                          <span className="text-mut text-[11.5px] shrink-0">{e.dates}</span>
                        </div>
                        <div className="text-gold text-[12.5px] mt-[2px]">{e.company}</div>
                        {e.description && <p className="text-dim text-[12.5px] mt-2 leading-[19px]">{e.description}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* education */}
              {!!profile?.education.length && (
                <section>
                  <h3 className="eyebrow mb-3">Education</h3>
                  <div className="flex flex-col gap-3">
                    {profile.education.map((e) => (
                      <div key={e.id} className="flex items-start gap-3 bg-surface border border-line rounded-xl p-4">
                        <GraduationCap size={16} className="text-gold mt-[2px] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className="text-ink text-[14px] font-semibold">{e.school}</span>
                            <span className="text-mut text-[11.5px] shrink-0">{e.dates}</span>
                          </div>
                          <div className="text-dim text-[12.5px] mt-[2px]">{e.degree}</div>
                          {e.grade && <div className="text-gold text-[11.5px] mt-[3px]">{e.grade}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* resumes */}
              <section>
                <h3 className="eyebrow mb-3">Resume</h3>
                {resumes.length === 0 ? (
                  <p className="text-mut text-[12.5px]">No resume on file.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {resumes.map((r) => (
                      <div key={r.id} className="flex items-center gap-3 bg-surface border border-line rounded-xl p-3">
                        <FileText size={18} className="text-gold shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-ink text-[13.5px] font-semibold truncate">{r.title}</div>
                          <div className="flex items-center gap-2 text-mut text-[11.5px] mt-[2px]">
                            <span className="flex items-center gap-1">
                              {r.kind === "ai" ? <><Sparkles size={11} /> AI-tailored</> : "Uploaded"}
                            </span>
                            {r.atsScore > 0 && <span className="text-gold">· {r.atsScore}% ATS</span>}
                            {r.date && <span>· {r.date}</span>}
                          </div>
                        </div>
                        {r.storagePath ? (
                          <button
                            onClick={() => openFile(r.storagePath!)}
                            disabled={opening === r.storagePath}
                            className="flex items-center gap-1.5 rounded-lg px-3 py-[7px] bg-gold/[0.12] border border-gold/30 text-goldbright text-[12px] font-semibold hover:bg-gold/20 disabled:opacity-50 shrink-0"
                          >
                            {opening === r.storagePath ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} View
                          </button>
                        ) : (
                          <span className="text-mut text-[11px] shrink-0">No file</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* cover letters */}
              <section>
                <h3 className="eyebrow mb-3">Cover Letter</h3>
                {covers.length === 0 ? (
                  <p className="text-mut text-[12.5px]">No cover letter attached.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {covers.map((c) => (
                      <div key={c.path} className="flex items-center gap-3 bg-surface border border-line rounded-xl p-3">
                        <FileCheck2 size={18} className="text-gold shrink-0" />
                        <div className="flex-1 min-w-0 text-ink text-[13.5px] font-semibold truncate">
                          {c.name.replace(/^\d+_/, "")}
                        </div>
                        <button
                          onClick={() => openFile(c.path)}
                          disabled={opening === c.path}
                          className="flex items-center gap-1.5 rounded-lg px-3 py-[7px] bg-gold/[0.12] border border-gold/30 text-goldbright text-[12px] font-semibold hover:bg-gold/20 disabled:opacity-50 shrink-0"
                        >
                          {opening === c.path ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} View
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
