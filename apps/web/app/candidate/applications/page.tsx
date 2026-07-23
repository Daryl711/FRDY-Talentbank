"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { MapPin, Users, Clock, Heart, Send, Loader2, Check } from "lucide-react";
import { getSubmittedJobs, APPLICATION_STAGES, type ApplicationStage, type SubmittedJob } from "@/lib/candidate";

/** Horizontal pipeline showing how far an application has progressed. */
function StageTracker({ stage }: { stage: ApplicationStage }) {
  const currentIdx = APPLICATION_STAGES.findIndex((s) => s.key === stage);
  return (
    <div className="flex items-start mt-4">
      {APPLICATION_STAGES.map((s, i) => {
        const reached = i <= currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <Fragment key={s.key}>
            {i > 0 && (
              <div className={`flex-1 h-[2px] mt-[10px] ${i <= currentIdx ? "bg-gold/50" : "bg-line"}`} />
            )}
            <div className="flex flex-col items-center gap-[6px] w-[74px] shrink-0">
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center border text-[10px] font-mono ${
                  reached ? "bg-gold/20 border-gold/50 text-goldbright" : "bg-surface2 border-line text-mut"
                }`}
              >
                {i < currentIdx ? <Check size={12} /> : i + 1}
              </div>
              <span className={`text-[11px] text-center leading-tight ${isCurrent ? "text-ink font-semibold" : reached ? "text-dim" : "text-mut"}`}>
                {s.label}
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export default function ApplicationsPage() {
  const [jobs, setJobs] = useState<SubmittedJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubmittedJobs()
      .then(setJobs)
      .finally(() => setLoading(false));
  }, []);

  const matchedCount = useMemo(() => jobs.filter((j) => j.matched).length, [jobs]);

  return (
    <div className="max-w-[860px] mx-auto">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-[32px] font-bold text-ink">Submitted Jobs</h1>
          <p className="eyebrow mt-2">{jobs.length} Applications · {matchedCount} Matched</p>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={22} className="animate-spin text-gold" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-surface border border-line rounded-2xl py-16 flex flex-col items-center gap-3 mt-6">
          <Send size={26} className="text-mut" />
          <p className="text-dim text-[14px]">No applications yet.</p>
          <p className="text-mut text-[13px]">Match with a company on the Job Match page to apply.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mt-6">
          {jobs.map((j) => (
            <div key={j.id} className="bg-surface border border-line rounded-2xl p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gold/[0.12] border border-gold/30 font-serif text-[17px] text-goldbright shrink-0">
                  {j.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[15.5px] text-ink truncate">{j.role}</div>
                  <div className="text-dim text-[13px] mt-[2px]">{j.name}</div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-[7px] text-mut text-[12px]">
                    {j.location && <span className="flex items-center gap-1"><MapPin size={12} /> {j.location}</span>}
                    {j.employees && <span className="flex items-center gap-1"><Users size={12} /> {j.employees}</span>}
                    <span className="flex items-center gap-1"><Clock size={12} /> {j.date}</span>
                    <span className="text-gold">{j.match}% match</span>
                  </div>
                </div>
                {j.matched ? (
                  <span className="flex items-center gap-[5px] rounded-lg px-[10px] py-[6px] bg-ok/[0.14] border border-ok/35 font-mono text-[9.5px] tracking-wide font-bold text-ok shrink-0">
                    <Heart size={11} /> MATCHED
                  </span>
                ) : (
                  <span className="rounded-lg px-[10px] py-[6px] bg-surface2 border border-line font-mono text-[9.5px] tracking-wide text-dim shrink-0">
                    APPLIED
                  </span>
                )}
              </div>

              {/* Application progress pipeline */}
              <StageTracker stage={j.stage} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
