"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/components/ui";
import { EmployabilityTrendLine } from "@/components/university/UniCharts";
import {
  uniName, uniStats, employabilityTrend, industryLanding, courseOverview,
  getUniversityCandidates, groupByCourse, type UniversityCandidate,
} from "@/lib/university";
import { generateUniversityDashboardReport } from "@/lib/universityReport";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { StatCard } from "@/lib/types";

export default function UniversityDashboard() {
  const [candidates, setCandidates] = useState<UniversityCandidate[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getUniversityCandidates().then(setCandidates);
  }, []);

  if (isSupabaseConfigured && candidates === null) {
    return (
      <>
        <PageHeader title="Dashboard" subtitle="Loading your students…" />
        <Panel className="p-16 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-gold" />
        </Panel>
      </>
    );
  }

  if (candidates && candidates.length > 0) {
    return <LiveDashboard candidates={candidates} />;
  }

  return <MockDashboard />;
}

/* ================================================================ LIVE DASHBOARD */
function LiveDashboard({ candidates }: { candidates: UniversityCandidate[] }) {
  const total = candidates.length;
  const confidences = candidates.map((c) => c.confidence).filter((v): v is number => v != null);
  const avgConfidence = confidences.length ? Math.round(confidences.reduce((s, v) => s + v, 0) / confidences.length) : 0;
  const horizons = candidates.map((c) => c.horizonMonths).filter((v): v is number => v != null);
  const avgHorizon = horizons.length ? Math.round((horizons.reduce((s, v) => s + v, 0) / horizons.length) * 10) / 10 : null;
  const salaries = candidates.map((c) => c.targetSalary).filter((v): v is string => !!v);

  const liveStats: StatCard[] = [
    { label: "Overall Employability", value: `${avgConfidence}%`, delta: "Live data", deltaTone: "flat", icon: "trending" },
    { label: "Students Profiled", value: String(total), delta: "Live data", deltaTone: "flat", icon: "users" },
    { label: "Avg. Time to Next Role", value: avgHorizon != null ? `${avgHorizon}mo` : "—", delta: "Live data", deltaTone: "flat", icon: "clock" },
    { label: "Avg. Predicted Salary", value: salaries.length ? mostCommonSalaryLabel(salaries) : "—", delta: "Live data", deltaTone: "flat", icon: "briefcase" },
  ];

  const courses = groupByCourse(candidates);
  const courseRows = courses.map((c) => ({
    course: c.course,
    graduates: c.graduates,
    employed: c.avgConfidence,
    salary: c.avgSalaryK != null ? `$${c.avgSalaryK}K` : "—",
    yoy: 0,
  }));

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${uniName} · Live student outcomes overview`}
        action={
          <button
            onClick={() => generateUniversityDashboardReport(uniName, liveStats, industryLanding, courseRows)}
            title="Download a dashboard report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {liveStats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} delta={s.delta} deltaTone={s.deltaTone} icon={s.icon} />
        ))}
      </div>

      {/* trend + industry — no historical/industry data exists per-candidate,
          so these stay illustrative even in the live view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Panel className="lg:col-span-2 p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Employability Rate Trend</h2>
          <p className="text-mut text-[12px] mt-1">Illustrative — no historical snapshots are recorded yet</p>
          <div className="mt-4"><EmployabilityTrendLine data={employabilityTrend} /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Industry Landing</h2>
          <p className="text-mut text-[12px] mt-1">Illustrative — candidates don't record an industry</p>
          <div className="mt-5 flex flex-col gap-[18px]">
            {industryLanding.map((i) => (
              <div key={i.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ink text-[13px]">{i.name}</span>
                  <span className="text-[13px] font-semibold" style={{ color: i.color }}>{i.pct}%</span>
                </div>
                <div className="h-[5px] rounded-full bg-surface3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${i.pct * 2.2}%`, backgroundColor: i.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* course overview table */}
      <Panel className="p-6 mt-6">
        <h2 className="font-serif text-[22px] font-bold text-ink">Course Readiness Overview</h2>
        <p className="text-mut text-[12px] mt-1">By degree · "Employed" is the average trajectory-model readiness score, not a confirmed outcome</p>
        <table className="w-full mt-5 border-collapse">
          <thead>
            <tr className="eyebrow text-left">
              <th className="font-normal pb-3">Course</th>
              <th className="font-normal pb-3">Students</th>
              <th className="font-normal pb-3">Readiness</th>
              <th className="font-normal pb-3">Avg. Predicted Salary</th>
            </tr>
          </thead>
          <tbody>
            {courseRows.map((c) => (
              <tr key={c.course} className="border-t border-line/70">
                <td className="py-4 text-ink text-[14px] font-medium">{c.course}</td>
                <td className="py-4 text-dim text-[14px]">{c.graduates}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[5px] w-[70px] rounded-full bg-surface3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.employed}%`, backgroundColor: c.employed >= 90 ? "#3fbf6a" : "#5b8fd6" }} />
                    </div>
                    <span className={`text-[13px] font-semibold ${c.employed >= 90 ? "text-ok" : "text-info"}`}>{c.employed}%</span>
                  </div>
                </td>
                <td className="py-4 text-gold text-[14px] font-semibold">{c.salary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}

/** Averages several "$XXK" strings and re-formats — used for the salary stat tile. */
function mostCommonSalaryLabel(labels: string[]): string {
  const nums = labels.map((v) => Number(v.replace(/[^0-9.]/g, ""))).filter((n) => Number.isFinite(n));
  if (!nums.length) return "—";
  return `$${Math.round(nums.reduce((s, v) => s + v, 0) / nums.length)}K`;
}

/* ================================================================ MOCK DASHBOARD */
function MockDashboard() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`${uniName} · Graduate outcomes overview · Class of 2026`}
        action={
          <button
            onClick={() => generateUniversityDashboardReport(uniName, uniStats, industryLanding, courseOverview)}
            title="Download a dashboard report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {uniStats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} delta={s.delta} deltaTone={s.deltaTone} icon={s.icon} />
        ))}
      </div>

      {/* trend + industry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Panel className="lg:col-span-2 p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Employability Rate Trend</h2>
          <p className="text-mut text-[12px] mt-1">6-year trajectory · all courses combined</p>
          <div className="mt-4"><EmployabilityTrendLine data={employabilityTrend} /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Industry Landing</h2>
          <div className="mt-5 flex flex-col gap-[18px]">
            {industryLanding.map((i) => (
              <div key={i.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ink text-[13px]">{i.name}</span>
                  <span className="text-[13px] font-semibold" style={{ color: i.color }}>{i.pct}%</span>
                </div>
                <div className="h-[5px] rounded-full bg-surface3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${i.pct * 2.2}%`, backgroundColor: i.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* course overview table */}
      <Panel className="p-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[22px] font-bold text-ink">Course Employability Overview</h2>
          <a className="text-info text-[13px] hover:opacity-80 cursor-pointer">Full report →</a>
        </div>
        <table className="w-full mt-5 border-collapse">
          <thead>
            <tr className="eyebrow text-left">
              <th className="font-normal pb-3">Course</th>
              <th className="font-normal pb-3">Graduates</th>
              <th className="font-normal pb-3">Employed</th>
              <th className="font-normal pb-3">Avg. Starting Salary</th>
              <th className="font-normal pb-3">YoY Trend</th>
            </tr>
          </thead>
          <tbody>
            {courseOverview.map((c) => (
              <tr key={c.course} className="border-t border-line/70">
                <td className="py-4 text-ink text-[14px] font-medium">{c.course}</td>
                <td className="py-4 text-dim text-[14px]">{c.graduates}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[5px] w-[70px] rounded-full bg-surface3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.employed}%`, backgroundColor: c.employed >= 90 ? "#3fbf6a" : "#5b8fd6" }} />
                    </div>
                    <span className={`text-[13px] font-semibold ${c.employed >= 90 ? "text-ok" : "text-info"}`}>{c.employed}%</span>
                  </div>
                </td>
                <td className="py-4 text-gold text-[14px] font-semibold">{c.salary}</td>
                <td className={`py-4 text-[13px] font-semibold ${c.yoy >= 0 ? "text-ok" : "text-danger"}`}>{c.yoy >= 0 ? "+" : ""}{c.yoy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
