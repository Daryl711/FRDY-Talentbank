"use client";

import { useEffect, useState } from "react";
import { X, Clock, DollarSign, FileText, Sparkles, Download, Loader2, CalendarClock, MapPin, Video, Phone } from "lucide-react";
import { getResumes, getResumeFileUrl, type Resume, type SubmittedJob } from "@/lib/candidate";
import { getInterview, type Interview } from "@/lib/interviews";

function fmtSalary(v: number | null | undefined) {
  return typeof v === "number" ? `$${v.toLocaleString()}` : "—";
}

/**
 * Read-only view of what the candidate submitted with a specific application:
 * the date applied, the salary figures they entered on the job card, and the
 * resume(s) on file (resumes aren't tracked per-application — same set the
 * employer sees in CandidateDossier — so this lists what would have gone out).
 * Mounted fresh per job (parent keys on job.id), so loading initializes true
 * without the effect needing a synchronous setState.
 */
export default function ApplicationDetailsModal({
  job,
  onClose,
}: {
  job: SubmittedJob | null;
  onClose: () => void;
}) {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState<string | null>(null);

  useEffect(() => {
    if (!job) return;
    let active = true;
    Promise.all([getResumes(), job.matchId ? getInterview(job.matchId) : Promise.resolve(null)]).then(([r, i]) => {
      if (active) {
        setResumes(r);
        setInterview(i);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [job]);

  async function openFile(path: string) {
    setOpening(path);
    try {
      const url = await getResumeFileUrl(path);
      if (url) window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setOpening(null);
    }
  }

  if (!job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div
        className="w-full max-w-[560px] max-h-[85vh] flex flex-col bg-bg border border-line rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-6 py-5 border-b border-line">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold/[0.12] border border-gold/30 font-serif text-[17px] text-goldbright shrink-0">
            {job.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-serif text-[19px] font-bold text-ink truncate">{job.role}</div>
            <div className="text-dim text-[12.5px] truncate">{job.name}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-lg flex items-center justify-center bg-surface2 border border-line text-mut hover:text-ink">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex flex-col gap-6">
          {/* date applied */}
          <div className="flex items-center gap-2 text-mut text-[12.5px]">
            <Clock size={13} /> Applied {job.date}
          </div>

          {/* interview details, once the employer has scheduled one */}
          {!loading && interview && (
            <section className="rounded-2xl p-4 bg-gold/[0.06] border border-gold/25">
              <div className="flex items-center gap-2 text-goldbright text-[13.5px] font-semibold">
                <CalendarClock size={15} /> Interview Scheduled
              </div>
              <div className="text-ink text-[14px] font-semibold mt-2">
                {new Date(interview.scheduledAt).toLocaleString("en-US", { dateStyle: "full", timeStyle: "short" })}
              </div>
              <div className="flex items-center gap-1.5 text-dim text-[12.5px] mt-1">
                {interview.mode === "Video Call" ? <Video size={12} /> : interview.mode === "Phone Call" ? <Phone size={12} /> : <MapPin size={12} />}
                {interview.mode}
                {interview.location && <span>· {interview.location}</span>}
              </div>
              {interview.notes && <p className="text-dim text-[12.5px] mt-2 leading-[18px]">{interview.notes}</p>}
            </section>
          )}

          {/* salary details submitted with this application */}
          <section>
            <h3 className="eyebrow mb-3">Submitted Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-mut text-[11.5px]"><DollarSign size={12} /> Expected Salary</div>
                <div className="text-ink text-[16px] font-semibold mt-1">{fmtSalary(job.expectedSalary)}</div>
              </div>
              <div className="bg-surface border border-line rounded-xl p-4">
                <div className="flex items-center gap-1.5 text-mut text-[11.5px]"><DollarSign size={12} /> Last Drawn Salary</div>
                <div className="text-ink text-[16px] font-semibold mt-1">{fmtSalary(job.lastDrawnSalary)}</div>
              </div>
            </div>
          </section>

          {/* resume(s) on file */}
          <section>
            <h3 className="eyebrow mb-3">Resume</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={20} className="animate-spin text-gold" />
              </div>
            ) : resumes.length === 0 ? (
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
        </div>
      </div>
    </div>
  );
}
