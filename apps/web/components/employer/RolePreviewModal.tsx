"use client";

import { X, MapPin, Briefcase, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useState } from "react";

export interface RolePreviewData {
  title: string;
  location: string | null;
  type: string;
  experienceLevel: string | null;
  education: string | null;
  package: string | null;
  perks: string[];
  tags: string[];
  description: string | null;
  responsibilities: string[];
  requirements: string[];
}

/**
 * Read-only preview of how a role will render on the candidate's swipe deck
 * (mirrors CompanyCard in app/candidate/match/page.tsx), so an employer can
 * check the posting before it goes live. No match %, salary inputs, or
 * resume/cover-letter sections — those are candidate-side, not part of the
 * listing itself.
 */
export default function RolePreviewModal({
  open,
  onClose,
  companyName,
  companyInitials,
  role,
}: {
  open: boolean;
  onClose: () => void;
  companyName: string;
  companyInitials: string;
  role: RolePreviewData;
}) {
  const [showDetails, setShowDetails] = useState(true);
  if (!open) return null;

  const hasDetails =
    !!role.description || role.responsibilities.length > 0 || role.requirements.length > 0 || !!role.education;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/60 overflow-y-auto" onClick={onClose}>
      <div className="w-full max-w-[440px] mt-10 mb-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="flex items-center gap-2 text-dim text-[13px] font-semibold">
            <Eye size={15} /> Candidate preview
          </span>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface2 border border-line text-mut hover:text-ink">
            <X size={16} />
          </button>
        </div>

        <div className="rounded-3xl p-6 border" style={{ borderColor: "#3d6b3f", background: "linear-gradient(135deg,#183a26,#0f2418)" }}>
          <div className="flex justify-between items-start">
            <div className="w-[74px] h-[74px] rounded-2xl flex items-center justify-center bg-gold/15 border border-gold/30 font-serif text-[24px] text-goldbright">
              {companyInitials || "•"}
            </div>
          </div>

          <h2 className="font-serif text-[28px] text-ink mt-4">{companyName}</h2>
          <p className="text-[#bfe3c4] text-[16px] mt-1">{role.title || "Untitled role"}</p>

          <div className="flex gap-5 mt-4 text-[#9dc4a4] text-[13px]">
            {role.location && <span className="flex items-center gap-1"><MapPin size={13} /> {role.location}</span>}
            {role.type && <span>{role.type}</span>}
          </div>

          {role.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {role.tags.map((t) => (
                <span key={t} className="rounded-full px-3 py-[7px] text-[#cfe6d2] text-[12px]" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  {t}
                </span>
              ))}
            </div>
          )}

          {(role.experienceLevel || hasDetails) && (
            <div className="mt-4">
              {role.experienceLevel && (
                <span className="inline-flex items-center gap-1 rounded-full px-3 py-[6px] text-[#cfe6d2] text-[12px]" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                  <Briefcase size={12} /> {role.experienceLevel} level
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
                      {role.description && (
                        <div>
                          <div className="font-mono text-[10px] tracking-widest text-[#9dc4a4] uppercase mb-1.5">Description</div>
                          <p className="text-[#cfe6d2] text-[14px] leading-[21px] whitespace-pre-line">{role.description}</p>
                        </div>
                      )}
                      {role.responsibilities.length > 0 && (
                        <div>
                          <div className="font-mono text-[10px] tracking-widest text-[#9dc4a4] uppercase mb-1.5">Responsibilities</div>
                          <ul className="flex flex-col gap-1">
                            {role.responsibilities.map((x, i) => (
                              <li key={i} className="flex gap-2 text-[#cfe6d2] text-[14px] leading-[21px]"><span className="text-goldbright">•</span> {x}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {role.requirements.length > 0 && (
                        <div>
                          <div className="font-mono text-[10px] tracking-widest text-[#9dc4a4] uppercase mb-1.5">Requirements</div>
                          <ul className="flex flex-col gap-1">
                            {role.requirements.map((x, i) => (
                              <li key={i} className="flex gap-2 text-[#cfe6d2] text-[14px] leading-[21px]"><span className="text-goldbright">•</span> {x}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {role.education && (
                        <div>
                          <div className="font-mono text-[10px] tracking-widest text-[#9dc4a4] uppercase mb-1">Education</div>
                          <div className="text-[#cfe6d2] text-[14px] leading-[21px]">{role.education}</div>
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
              <div className="font-mono text-[10px] tracking-widest text-[#9dc4a4] uppercase">Package</div>
              <div className="font-serif text-[26px] text-goldbright mt-1">{role.package || "—"}</div>
            </div>
            {role.perks.length > 0 && (
              <div className="flex flex-col items-end gap-[6px]">
                {role.perks.map((p) => (
                  <span key={p} className="rounded-lg px-[10px] py-1 text-goldbright text-[12px]" style={{ backgroundColor: "rgba(216,180,90,0.12)" }}>{p}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-[13px] text-dim text-[14px] font-medium rounded-xl border border-line bg-surface hover:text-ink"
        >
          Close preview
        </button>
      </div>
    </div>
  );
}
