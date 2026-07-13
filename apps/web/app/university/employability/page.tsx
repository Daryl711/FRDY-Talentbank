"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { CourseTrendLine, EmployabilityGauge, RateByCourseBars } from "@/components/university/UniCharts";
import {
  courseEmployability, employabilityOverall, facultyFilters, rateByCourse,
} from "@/lib/university";

export default function EmployabilityPage() {
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
      <PageHeader title="Employability" subtitle={`Overall rate: ${employabilityOverall}% · ${courseEmployability.length} courses tracked · Class of 2026`} />

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
