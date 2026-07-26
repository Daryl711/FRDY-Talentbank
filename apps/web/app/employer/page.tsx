"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/components/ui";
import ApplicationsChart from "@/components/employer/ApplicantsChart";
import RecentApplicants, { type RecentApplicantRow } from "@/components/employer/RecentApplicants";
import { periodLabel, stats, pipeline, applicants } from "@/lib/mock";
import { generateEmployerDashboardReport } from "@/lib/employerReport";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getMyCompany, getCompanyMatches, getCompanyRoles, type Company } from "@/lib/employer";
import type { HireStage, MatchedCandidate, StatCard } from "@/lib/types";

// Board stages shown on the funnel, in pipeline order (mirrors the Hiring
// board's STAGE_ORDER). Rejected is terminal/off-board, left out here.
const FUNNEL_STAGES: HireStage[] = ["Applied", "Screening", "Shortlisted", "Interview", "Final Round", "Offer"];

export default function DashboardPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [cands, setCands] = useState<MatchedCandidate[]>([]);
  const [openRoles, setOpenRoles] = useState(0);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getMyCompany().then((c) => {
      if (!c) {
        setLoading(false);
        return;
      }
      setCompany(c);
      Promise.all([getCompanyMatches(), getCompanyRoles(c.id)])
        .then(([matches, roles]) => {
          setCands(matches);
          setOpenRoles(roles.length);
        })
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Loading your pipeline…" />
        <Panel className="p-16 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-gold" />
        </Panel>
      </>
    );
  }

  if (company) {
    return <LiveDashboard company={company} cands={cands} openRoles={openRoles} />;
  }

  return <MockDashboard />;
}

/* ================================================================ LIVE DASHBOARD */
function LiveDashboard({ company, cands, openRoles }: { company: Company; cands: MatchedCandidate[]; openRoles: number }) {
  const total = cands.length;
  const hired = cands.filter((c) => c.stage === "Hired").length;
  const avgScore = total > 0 ? Math.round(cands.reduce((s, c) => s + c.score, 0) / total) : 0;

  const liveStats: StatCard[] = [
    { label: "Total Applicants", value: String(total), delta: "Live data", deltaTone: "flat", icon: "users" },
    { label: "Open Roles", value: String(openRoles), delta: "Live data", deltaTone: "flat", icon: "briefcase" },
    { label: "Hired", value: String(hired), delta: "Live data", deltaTone: "flat", icon: "trending" },
    { label: "Avg. Match Score", value: total > 0 ? `${avgScore}%` : "—", delta: "Live data", deltaTone: "flat", icon: "clock" },
  ];

  const livePipeline = FUNNEL_STAGES.map((stage) => ({
    stage,
    count: cands.filter((c) => c.stage === stage).length,
  }));
  const peak = Math.max(1, ...livePipeline.map((s) => s.count));

  const recentRows: RecentApplicantRow[] = [...cands]
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 8)
    .map((c) => ({
      id: c.matchId,
      initials: c.initials,
      name: c.name,
      role: c.role ?? c.headline ?? "Unspecified",
      trait: c.trait,
      match: c.score,
      stage: c.stage,
    }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${company.name} · Live pipeline`}
        action={
          <button
            onClick={() => generateEmployerDashboardReport(liveStats, livePipeline, recentRows, `${company.name} · Live pipeline`)}
            disabled={total === 0}
            title={total === 0 ? "No applicants yet to report on" : "Download a dashboard report (.xlsx)"}
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink disabled:opacity-40"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      {/* headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {liveStats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} delta={s.delta} deltaTone={s.deltaTone} icon={s.icon} />
        ))}
      </div>

      {/* applications trend + pipeline funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Panel className="p-6 lg:col-span-2">
          <h2 className="font-serif text-[22px] font-bold text-ink">Applications vs. Hires</h2>
          <p className="text-mut text-[12px] mt-1">6-month rolling view</p>
          <div className="mt-4"><ApplicationsChart /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Pipeline</h2>
          <p className="text-mut text-[12px] mt-1">Candidates by stage</p>
          <div className="mt-5 flex flex-col gap-4">
            {livePipeline.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between mb-[6px]">
                  <span className="text-dim text-[13px]">{s.stage}</span>
                  <span className="text-ink text-[13px] font-semibold">{s.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-goldbright to-golddeep"
                    style={{ width: `${Math.max((s.count / peak) * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* recent applicants table */}
      {total === 0 ? (
        <Panel className="p-10 text-center text-mut text-[13px] mt-6">No applicants yet.</Panel>
      ) : (
        <RecentApplicants applicants={recentRows} />
      )}
    </>
  );
}

/* ================================================================ MOCK DASHBOARD */
function MockDashboard() {
  const peak = Math.max(...pipeline.map((s) => s.count));

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={periodLabel}
        action={
          <button
            onClick={() => generateEmployerDashboardReport(stats, pipeline, applicants, periodLabel)}
            title="Download a dashboard report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      {/* headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            label={s.label}
            value={s.value}
            delta={s.delta}
            deltaTone={s.deltaTone}
            icon={s.icon}
          />
        ))}
      </div>

      {/* applications trend + pipeline funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Panel className="p-6 lg:col-span-2">
          <h2 className="font-serif text-[22px] font-bold text-ink">Applications vs. Hires</h2>
          <p className="text-mut text-[12px] mt-1">6-month rolling view</p>
          <div className="mt-4"><ApplicationsChart /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Pipeline</h2>
          <p className="text-mut text-[12px] mt-1">Candidates by stage</p>
          <div className="mt-5 flex flex-col gap-4">
            {pipeline.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between mb-[6px]">
                  <span className="text-dim text-[13px]">{s.stage}</span>
                  <span className="text-ink text-[13px] font-semibold">{s.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-goldbright to-golddeep"
                    style={{ width: `${Math.max((s.count / peak) * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* recent applicants table */}
      <RecentApplicants />
    </>
  );
}
