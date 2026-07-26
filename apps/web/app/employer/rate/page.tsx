"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/components/ui";
import { RateByDept, RateTrend } from "@/components/employer/HiringRateCharts";
import { hiringRateByDept, hiringRateTrend } from "@/lib/mock";
import { generateHiringRateReport } from "@/lib/employerReport";
import { isSupabaseConfigured } from "@/lib/supabase";
import { getMyCompany, getCompanyMatches, getHireDurationsDays, type Company } from "@/lib/employer";
import type { MatchedCandidate } from "@/lib/types";

const OVERALL_RATE = "7.4%";
const BEST_DEPARTMENT = "Finance";
const AVG_TIME_TO_HIRE = "18d";

export default function HiringRatePage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [cands, setCands] = useState<MatchedCandidate[]>([]);
  const [hireDurations, setHireDurations] = useState<number[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getMyCompany().then((c) => {
      if (!c) {
        setLoading(false);
        return;
      }
      setCompany(c);
      getCompanyMatches()
        .then((matches) => {
          setCands(matches);
          return getHireDurationsDays(matches);
        })
        .then(setHireDurations)
        .finally(() => setLoading(false));
    });
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="Hiring Rate" subtitle="Loading your pipeline…" />
        <Panel className="p-16 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-gold" />
        </Panel>
      </>
    );
  }

  if (company) {
    return <LiveHiringRate cands={cands} hireDurations={hireDurations} />;
  }

  return <MockHiringRate />;
}

/* ================================================================ LIVE RATE */
function LiveHiringRate({ cands, hireDurations }: { cands: MatchedCandidate[]; hireDurations: number[] }) {
  const total = cands.length;
  const hired = cands.filter((c) => c.stage === "Hired").length;
  const overallRate = total > 0 ? `${Math.round((hired / total) * 100)}%` : "—";
  const avgTimeToHire = hireDurations.length > 0
    ? `${Math.round(hireDurations.reduce((s, d) => s + d, 0) / hireDurations.length)}d`
    : "—";

  // Group by the role the candidate applied to.
  const byRoleMap = new Map<string, { total: number; hired: number }>();
  for (const c of cands) {
    const role = c.role ?? "Unspecified";
    const bucket = byRoleMap.get(role) ?? { total: 0, hired: 0 };
    bucket.total += 1;
    if (c.stage === "Hired") bucket.hired += 1;
    byRoleMap.set(role, bucket);
  }
  const byRole = [...byRoleMap.entries()]
    .map(([label, b]) => ({ label, rate: Math.round((b.hired / b.total) * 100) }))
    .sort((a, b) => b.rate - a.rate);
  const bestRole = byRole[0]?.label ?? "—";

  // Applications by month (last 6 months), and what fraction are currently
  // Hired — an approximation of conversion rate over time (not a true
  // point-in-time rate, since it uses each candidate's *current* stage).
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleString("en-US", { month: "short" }) });
  }
  const trend = months.map(({ key, label }) => {
    const inMonth = cands.filter((c) => {
      if (!c.createdAt) return false;
      const d = new Date(c.createdAt);
      return `${d.getFullYear()}-${d.getMonth()}` === key;
    });
    const monthHired = inMonth.filter((c) => c.stage === "Hired").length;
    return { month: label, rate: inMonth.length > 0 ? Math.round((monthHired / inMonth.length) * 100) : 0 };
  });

  return (
    <>
      <PageHeader
        title="Hiring Rate"
        subtitle="Conversion from application to hire, computed from your live pipeline"
        action={
          <button
            onClick={() => generateHiringRateReport(overallRate, bestRole, avgTimeToHire, trend, byRole)}
            disabled={total === 0}
            title={total === 0 ? "No applicants yet to report on" : "Download a hiring rate report (.xlsx)"}
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink disabled:opacity-40"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatTile label="Overall Hiring Rate" value={overallRate} delta="Live data" deltaTone="flat" icon="trending" />
        <StatTile label="Best Converting Role" value={bestRole} delta="Live data" deltaTone="flat" icon="briefcase" />
        <StatTile label="Avg. Time to Hire" value={avgTimeToHire} delta="Live data" deltaTone="flat" icon="clock" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Hiring Rate Trend</h2>
          <p className="text-mut text-[12px] mt-1">6-month rolling view · applications by month currently Hired</p>
          <div className="mt-4"><RateTrend data={trend} /></div>
        </Panel>
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">By Role</h2>
          <p className="text-mut text-[12px] mt-1">Current period</p>
          {byRole.length > 0 ? (
            <div className="mt-4"><RateByDept data={byRole} /></div>
          ) : (
            <div className="mt-4 text-mut text-[13px] text-center py-10">No applicants yet.</div>
          )}
        </Panel>
      </div>
    </>
  );
}

/* ================================================================ MOCK RATE */
function MockHiringRate() {
  return (
    <>
      <PageHeader
        title="Hiring Rate"
        subtitle="Conversion from application to hire across roles and departments"
        action={
          <button
            onClick={() => generateHiringRateReport(OVERALL_RATE, BEST_DEPARTMENT, AVG_TIME_TO_HIRE, hiringRateTrend, hiringRateByDept.map((d) => ({ label: d.dept, rate: d.rate })))}
            title="Download a hiring rate report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatTile label="Overall Hiring Rate" value={OVERALL_RATE} delta="+1.2% vs last month" deltaTone="up" icon="trending" />
        <StatTile label="Best Department" value={BEST_DEPARTMENT} delta="9.4% conversion" deltaTone="up" icon="briefcase" />
        <StatTile label="Avg. Time to Hire" value={AVG_TIME_TO_HIRE} delta="-3d vs last quarter" deltaTone="down" icon="clock" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Hiring Rate Trend</h2>
          <p className="text-mut text-[12px] mt-1">6-month rolling view</p>
          <div className="mt-4"><RateTrend /></div>
        </Panel>
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">By Department</h2>
          <p className="text-mut text-[12px] mt-1">Current period</p>
          <div className="mt-4"><RateByDept /></div>
        </Panel>
      </div>
    </>
  );
}
