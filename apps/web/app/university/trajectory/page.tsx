"use client";

import { useState } from "react";
import { Cpu, ArrowRight } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/components/ui";
import TrajectoryChart from "@/components/TrajectoryChart";
import { trajProfiles, trajStats, trajModelVersion, traitEmoji } from "@/lib/mock";

export default function TrajectoryView({ subjectPlural = "candidates" }: { subjectPlural?: string }) {
  const [selectedId, setSelectedId] = useState(trajProfiles[0].id);
  const p = trajProfiles.find((x) => x.id === selectedId) ?? trajProfiles[0];

  return (
    <>
      <PageHeader
        title="Trajectory"
        subtitle={`ML-powered career path prediction · ${trajProfiles.length} ${subjectPlural} modelled`}
        action={
          <div className="flex items-center gap-2 bg-surface2 border border-line rounded-lg px-3 py-2 text-[12px] text-gold">
            <Cpu size={14} /> ML Model {trajModelVersion}
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {trajStats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="flex flex-col gap-3">
          <div className="eyebrow">Select Profile</div>
          {trajProfiles.map((prof) => {
            const on = prof.id === selectedId;
            return (
              <button
                key={prof.id}
                onClick={() => setSelectedId(prof.id)}
                className={`text-left rounded-2xl p-4 border transition-colors ${
                  on ? "border-gold bg-gold/[0.05]" : "border-line bg-surface hover:border-line2"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[20px]">{traitEmoji[prof.trait]}</span>
                  <span className="text-ink font-semibold text-[15px]">{prof.name}</span>
                </div>
                <div className="text-dim text-[12.5px] mt-3">{prof.role}</div>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono text-[11px] text-gold uppercase tracking-wide">→ {prof.arrowTarget}</span>
                  <span className="text-ok text-[13px] font-semibold">{prof.score}%</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-6">
          <Panel className="p-6 bg-gradient-to-br from-[#16233f] to-surface">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[26px]">{traitEmoji[p.trait]}</span>
                <div>
                  <div className="font-serif text-[24px] font-bold text-ink">{p.name}</div>
                  <div className="text-dim text-[13px]">{p.role} · {p.currentSalary}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="eyebrow">Confidence</div>
                <div className="font-serif text-[30px] font-bold text-gold">{p.confidence}%</div>
                <div className="text-mut text-[11px]">in {p.horizonMonths} months</div>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-4 text-[14px]">
              <span className="eyebrow">Predicted Next Role</span>
              <ArrowRight size={14} className="text-gold" />
              <span className="font-serif text-[17px] font-bold text-ink">{p.targetRole}</span>
              <span className="text-dim">({p.targetSalary})</span>
            </div>
          </Panel>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel className="p-6">
              <h2 className="font-serif text-[19px] font-bold text-ink">Career Score Trajectory</h2>
              <p className="text-mut text-[12px] mt-1">Predicted readiness over time</p>
              <div className="mt-3"><TrajectoryChart data={p.trajectory} /></div>
            </Panel>

            <Panel className="p-6">
              <h2 className="font-serif text-[19px] font-bold text-ink">Next Role Probability</h2>
              <p className="text-mut text-[12px] mt-1">ML-ranked outcomes</p>
              <div className="mt-5 flex flex-col gap-5">
                {p.nextRoles.map((r) => (
                  <div key={r.role}>
                    <div className="flex items-center justify-between text-[13px] mb-2">
                      <span><span className="text-ink font-semibold">{r.role}</span> <span className="text-mut">@ {r.context}</span></span>
                      <span className="text-gold font-semibold">{r.pct}%</span>
                    </div>
                    <div className="h-[6px] rounded-full bg-surface3 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-golddeep to-goldbright" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <Panel className="p-6">
            <h2 className="font-serif text-[19px] font-bold text-ink">Skills Gap Analysis</h2>
            <p className="text-mut text-[12px] mt-1">Current level vs. requirement for predicted role</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mt-5">
              {p.skills.map((s) => {
                const gap = s.required - s.current;
                return (
                  <div key={s.name}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-ink font-medium">{s.name}</span>
                      <span className="font-mono text-[11px] text-danger">GAP +{gap}</span>
                    </div>
                    <div className="h-[6px] rounded-full bg-surface3 overflow-hidden mt-2 relative">
                      <div className="h-full rounded-full bg-gradient-to-r from-golddeep to-goldbright" style={{ width: `${s.current}%` }} />
                      <div className="absolute top-0 h-full w-[2px] bg-ink/70" style={{ left: `${s.required}%` }} />
                    </div>
                    <div className="flex items-center justify-between eyebrow mt-2">
                      <span>Current: {s.current}</span>
                      <span>Required: {s.required}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
