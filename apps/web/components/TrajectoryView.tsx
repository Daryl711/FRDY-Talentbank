"use client";

import { useEffect, useState } from "react";
import { Cpu, ArrowRight, FileDown, Search } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/components/ui";
import TrajectoryChart from "@/components/TrajectoryChart";
import { trajProfiles as mockTrajProfiles, trajStats, trajModelVersion, traitEmoji } from "@/lib/mock";
import { getTrajectoryProfiles } from "@/lib/employer";
import { generateTrajectoryReport } from "@/lib/sharedReport";
import type { TrajProfile } from "@/lib/types";

const PAGE_SIZE = 20;

/**
 * Shared by apps/web/app/employer/trajectory and .../university/trajectory —
 * both viewer roles see the same career-path predictions, just with different
 * copy (`subjectPlural`). Backed by getTrajectoryProfiles (the
 * get_candidate_trajectories RPC over real profiles + candidate_trajectories
 * rows) with a client-side search/paginate fallback over the mock data when
 * Supabase isn't configured.
 */
export default function TrajectoryView({ subjectPlural = "candidates" }: { subjectPlural?: string }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [profiles, setProfiles] = useState<TrajProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTrajectoryProfiles({ search, limit: PAGE_SIZE, offset: page * PAGE_SIZE }).then((result) => {
      if (!alive) return;
      if (result) {
        setProfiles(result.profiles);
        setTotal(result.total);
      } else {
        const q = search.trim().toLowerCase();
        const filtered = q
          ? mockTrajProfiles.filter((p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q))
          : mockTrajProfiles;
        setTotal(filtered.length);
        setProfiles(filtered.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE));
      }
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [search, page]);

  useEffect(() => {
    // Keep a valid selection whenever the visible page/search results change.
    if (profiles.length && !profiles.some((p) => p.id === selectedId)) {
      setSelectedId(profiles[0].id);
    }
  }, [profiles, selectedId]);

  const p = profiles.find((x) => x.id === selectedId) ?? profiles[0];
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <PageHeader
        title="Trajectory"
        subtitle={`ML-powered career path prediction · ${total} ${subjectPlural} modelled`}
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => generateTrajectoryReport(profiles, subjectPlural, page, totalPages, total)}
              disabled={profiles.length === 0}
              title={profiles.length === 0 ? "No profiles loaded yet to report on" : "Download a trajectory report for this page (.xlsx)"}
              className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink disabled:opacity-40"
            >
              <FileDown size={15} /> Generate Report
            </button>
            <div className="flex items-center gap-2 bg-surface2 border border-line rounded-lg px-3 py-2 text-[12px] text-gold">
              <Cpu size={14} /> ML Model {trajModelVersion}
            </div>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {trajStats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} icon={s.icon} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* profile selector */}
        <div className="flex flex-col gap-3">
          <div className="eyebrow">Select Profile</div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-mut" />
            <input
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
              placeholder="Search name or role…"
              className="w-full bg-surface2 border border-line rounded-xl pl-9 pr-3 py-[10px] text-ink text-[13px] outline-none focus:border-gold/50 placeholder:text-mut"
            />
          </div>

          {loading ? (
            <div className="text-mut text-[13px] py-6 text-center">Loading…</div>
          ) : profiles.length === 0 ? (
            <div className="text-mut text-[13px] py-6 text-center">No matches.</div>
          ) : (
            profiles.map((prof) => {
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
            })
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={() => setPage((n) => Math.max(0, n - 1))}
                disabled={page === 0}
                className="text-dim text-[12px] disabled:opacity-40"
              >
                ← Prev
              </button>
              <span className="text-mut text-[12px]">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => setPage((n) => Math.min(totalPages - 1, n + 1))}
                disabled={page >= totalPages - 1}
                className="text-dim text-[12px] disabled:opacity-40"
              >
                Next →
              </button>
            </div>
          )}
        </div>

        {/* selected detail */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {!p ? (
            <Panel className="p-10 text-center text-mut text-[13px]">
              {loading ? "Loading…" : "No profile to show."}
            </Panel>
          ) : (
            <>
              {/* prediction banner */}
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
                {/* trajectory chart */}
                <Panel className="p-6">
                  <h2 className="font-serif text-[19px] font-bold text-ink">Career Score Trajectory</h2>
                  <p className="text-mut text-[12px] mt-1">Predicted readiness over time</p>
                  <div className="mt-3">
                    <TrajectoryChart data={p.trajectory} />
                  </div>
                </Panel>

                {/* next role probability */}
                <Panel className="p-6">
                  <h2 className="font-serif text-[19px] font-bold text-ink">Next Role Probability</h2>
                  <p className="text-mut text-[12px] mt-1">ML-ranked outcomes</p>
                  <div className="mt-5 flex flex-col gap-5">
                    {p.nextRoles.map((r) => (
                      <div key={r.role}>
                        <div className="flex items-center justify-between text-[13px] mb-2">
                          <span>
                            <span className="text-ink font-semibold">{r.role}</span> <span className="text-mut">@ {r.context}</span>
                          </span>
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

              {/* skills gap */}
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
            </>
          )}
        </div>
      </div>
    </>
  );
}
