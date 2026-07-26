"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2, Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { CourseTrendLine, EmployabilityGauge, RateByCourseBars } from "@/components/university/UniCharts";
import {
  courseEmployability, employabilityOverall, facultyFilters, rateByCourse,
  getUniversityCandidates, groupByCourse,
  type UniversityCandidate, type CourseGroup, type CourseEmployability,
} from "@/lib/university";
import { generateEmployabilityReport } from "@/lib/universityReport";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function EmployabilityPage() {
  const [candidates, setCandidates] = useState<UniversityCandidate[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getUniversityCandidates().then(setCandidates);
  }, []);

  if (isSupabaseConfigured && candidates === null) {
    return (
      <>
        <PageHeader title="Employability" subtitle="Loading your students…" />
        <Panel className="p-16 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-gold" />
        </Panel>
      </>
    );
  }

  if (candidates && candidates.length > 0) {
    return <LiveEmployability candidates={candidates} />;
  }

  return <MockEmployability />;
}

function toCourseEmployability(groups: CourseGroup[]): CourseEmployability[] {
  const year = String(new Date().getFullYear());
  return groups.map((g) => ({
    id: g.course,
    course: g.course,
    faculty: g.faculty,
    facultyCode: g.facultyCode,
    rate: g.avgConfidence,
    graduates: g.graduates,
    salary: g.avgSalaryK != null ? `$${g.avgSalaryK}K` : "—",
    avgTime: g.avgHorizonMonths != null ? `${g.avgHorizonMonths}mo` : "—",
    yoy: 0,
    trend: [{ year, rate: g.avgConfidence }],
  }));
}

/* ================================================================ LIVE EMPLOYABILITY */
function LiveEmployability({ candidates }: { candidates: UniversityCandidate[] }) {
  const courses = toCourseEmployability(groupByCourse(candidates));
  const [selectedId, setSelectedId] = useState(courses[0]?.id ?? "");
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const selected = courses.find((c) => c.id === selectedId) ?? courses[0];

  const confidences = candidates.map((c) => c.confidence).filter((v): v is number => v != null);
  const overall = confidences.length ? Math.round(confidences.reduce((s, v) => s + v, 0) / confidences.length) : 0;

  const list = courses.filter(
    (c) => (filter === "ALL" || c.facultyCode === filter) && c.course.toLowerCase().includes(query.toLowerCase()),
  );
  const rateByCourseLive = courses.map((c) => ({ course: c.course, rate: c.rate }));

  return (
    <>
      <PageHeader
        title="Employability"
        subtitle={`Overall readiness: ${overall}% · ${courses.length} courses tracked at Universiti Malaya`}
        action={
          <button
            onClick={() => generateEmployabilityReport(overall, courses)}
            title="Download an employability report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel className="p-6 flex flex-col items-center justify-center">
          <div className="eyebrow">Overall Rate</div>
          <div className="relative mt-2">
            <EmployabilityGauge pct={overall} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="font-serif text-[32px] font-bold text-info">{overall}%</div>
              <div className="eyebrow mt-1">Readiness</div>
            </div>
          </div>
          <div className="text-mut text-[12px] mt-2">Avg. trajectory-model confidence</div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Rate by Course</h2>
          <div className="mt-4"><RateByCourseBars data={rateByCourseLive} /></div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Panel className="p-6">
          <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[11px]">
            <Search size={16} className="text-mut" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="bg-transparent outline-none text-ink text-[14px] w-full placeholder:text-mut"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {facultyFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-mono text-[10px] tracking-wide px-3 py-[6px] rounded-full border transition-colors ${
                  filter === f ? "text-info border-info/40 bg-info/10" : "text-mut border-line hover:border-line2"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex flex-col mt-4">
            {list.map((c) => {
              const on = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex items-center justify-between px-3 py-[14px] border-l-2 transition-colors ${
                    on ? "border-info bg-info/[0.06]" : "border-transparent hover:bg-surface2"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-ink text-[14px] font-semibold">{c.course}</div>
                    <div className="eyebrow mt-1">{c.faculty}</div>
                  </div>
                  <span className={`text-[14px] font-semibold ${c.rate >= 90 ? "text-ok" : "text-info"}`}>{c.rate}%</span>
                </button>
              );
            })}
          </div>
        </Panel>

        {selected && (
          <div className="flex flex-col gap-6">
            <Panel className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-serif text-[24px] font-bold text-ink">{selected.course}</h2>
                  <div className="eyebrow mt-1">{selected.faculty}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
                {[
                  { l: "Readiness", v: `${selected.rate}%`, c: "text-info" },
                  { l: "Students", v: `${selected.graduates}`, c: "text-ink" },
                  { l: "Avg Predicted Salary", v: selected.salary, c: "text-gold" },
                  { l: "Avg Time to Next Role", v: selected.avgTime, c: "text-ink" },
                ].map((m) => (
                  <div key={m.l}>
                    <div className="eyebrow">{m.l}</div>
                    <div className={`font-serif text-[22px] font-bold mt-1 ${m.c}`}>{m.v}</div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-6">
              <h2 className="font-serif text-[18px] font-bold text-ink">Employability Trend</h2>
              <p className="text-mut text-[12px] mt-1">Current snapshot only — no historical data recorded yet</p>
              <div className="mt-3"><CourseTrendLine data={selected.trend} /></div>
            </Panel>
          </div>
        )}
      </div>
    </>
  );
}

/* ================================================================ MOCK EMPLOYABILITY */
function MockEmployability() {
  const [selectedId, setSelectedId] = useState(courseEmployability[0].id);
  const [filter, setFilter] = useState("ALL");
  const [query, setQuery] = useState("");
  const selected = courseEmployability.find((c) => c.id === selectedId) ?? courseEmployability[0];

  const list = courseEmployability.filter(
    (c) =>
      (filter === "ALL" || c.facultyCode === filter) &&
      c.course.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Employability"
        subtitle={`Overall rate: ${employabilityOverall}% · ${courseEmployability.length} courses tracked · Class of 2026`}
        action={
          <button
            onClick={() => generateEmployabilityReport(employabilityOverall, courseEmployability)}
            title="Download an employability report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* gauge */}
        <Panel className="p-6 flex flex-col items-center justify-center">
          <div className="eyebrow">Overall Rate</div>
          <div className="relative mt-2">
            <EmployabilityGauge pct={employabilityOverall} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="font-serif text-[32px] font-bold text-info">{employabilityOverall}%</div>
              <div className="eyebrow mt-1">Employed</div>
            </div>
          </div>
          <div className="text-ok text-[13px] mt-2">+3% vs 2025</div>
        </Panel>

        {/* rate by course */}
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Rate by Course</h2>
          <div className="mt-4"><RateByCourseBars data={rateByCourse} /></div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* course list */}
        <Panel className="p-6">
          <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[11px]">
            <Search size={16} className="text-mut" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses..."
              className="bg-transparent outline-none text-ink text-[14px] w-full placeholder:text-mut"
            />
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {facultyFilters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`font-mono text-[10px] tracking-wide px-3 py-[6px] rounded-full border transition-colors ${
                  filter === f ? "text-info border-info/40 bg-info/10" : "text-mut border-line hover:border-line2"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="flex flex-col mt-4">
            {list.map((c) => {
              const on = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className={`flex items-center justify-between px-3 py-[14px] border-l-2 transition-colors ${
                    on ? "border-info bg-info/[0.06]" : "border-transparent hover:bg-surface2"
                  }`}
                >
                  <div className="text-left">
                    <div className="text-ink text-[14px] font-semibold">{c.course}</div>
                    <div className="eyebrow mt-1">{c.faculty}</div>
                  </div>
                  <span className={`text-[14px] font-semibold ${c.rate >= 90 ? "text-ok" : "text-info"}`}>{c.rate}%</span>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* selected course detail */}
        <div className="flex flex-col gap-6">
          <Panel className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-[24px] font-bold text-ink">{selected.course}</h2>
                <div className="eyebrow mt-1">{selected.faculty}</div>
              </div>
              <span className="text-ok text-[12px] font-semibold">+{selected.yoy}% YOY</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5">
              {[
                { l: "Employability", v: `${selected.rate}%`, c: "text-info" },
                { l: "Graduates", v: `${selected.graduates}`, c: "text-ink" },
                { l: "Avg Salary", v: selected.salary, c: "text-gold" },
                { l: "Avg Time", v: selected.avgTime, c: "text-ink" },
              ].map((m) => (
                <div key={m.l}>
                  <div className="eyebrow">{m.l}</div>
                  <div className={`font-serif text-[22px] font-bold mt-1 ${m.c}`}>{m.v}</div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel className="p-6">
            <h2 className="font-serif text-[18px] font-bold text-ink">6-Year Employability Trend</h2>
            <div className="mt-3"><CourseTrendLine data={selected.trend} /></div>
          </Panel>
        </div>
      </div>
    </>
  );
}
