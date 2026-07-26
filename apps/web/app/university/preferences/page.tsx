"use client";

import { useEffect, useState } from "react";
import { FileDown, Loader2, Search } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { InterestScoreBars, SearchVolumeArea } from "@/components/university/UniCharts";
import { prefStats, searchTerms, getUniversityCandidates, computeSkillStats, type UniversityCandidate, type SkillStat } from "@/lib/university";
import { generatePreferencesReport } from "@/lib/universityReport";
import { isSupabaseConfigured } from "@/lib/supabase";
import type { SearchTerm } from "@/lib/university";

export default function CoursePreferencesPage() {
  const [candidates, setCandidates] = useState<UniversityCandidate[] | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getUniversityCandidates().then(setCandidates);
  }, []);

  if (isSupabaseConfigured && candidates === null) {
    return (
      <>
        <PageHeader title="Course Preferences" subtitle="Loading your students…" />
        <Panel className="p-16 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-gold" />
        </Panel>
      </>
    );
  }

  if (candidates && candidates.length > 0) {
    return <LivePreferences candidates={candidates} />;
  }

  return <MockPreferences />;
}

const SKILL_BAR_COLOR = "#d8b45a";

/* ================================================================ LIVE PREFERENCES */
function LivePreferences({ candidates }: { candidates: UniversityCandidate[] }) {
  const [query, setQuery] = useState("");
  const skillStats = computeSkillStats(candidates);
  const total = candidates.length;
  const top = skillStats[0];

  const liveStats = [
    { label: "Students Tracked", value: String(total), sub: "Live data", tone: "info" as const },
    { label: "Unique Skills Logged", value: String(skillStats.length), sub: "Across all profiles", tone: "info" as const },
    { label: "Top Skill", value: top?.skill ?? "—", sub: top ? `${top.count} students` : "No skills logged yet", tone: "gold" as const },
    { label: "Top Skill Coverage", value: top ? `${top.pctOfStudents}%` : "—", sub: "of tracked students", tone: "info" as const },
  ];

  const reportTerms: SearchTerm[] = skillStats.map((s, i) => ({
    rank: i + 1, category: "Skill", categoryColor: SKILL_BAR_COLOR, term: s.skill, count: String(s.count), delta: 0,
  }));

  const filtered = skillStats.filter((s) => s.skill.toLowerCase().includes(query.toLowerCase()));
  const ranked = filtered.slice(0, 20).map((s, i) => ({ ...s, rank: i + 1 }));
  const left = ranked.filter((_, i) => i % 2 === 0);
  const right = ranked.filter((_, i) => i % 2 === 1);
  const maxCount = skillStats[0]?.count ?? 1;

  return (
    <>
      <PageHeader
        title="Course Preferences"
        subtitle="Skill signals across your real students · reframed from search behaviour, which isn't tracked in this app"
        action={
          <div className="flex items-center gap-3">
            <button
              onClick={() => generatePreferencesReport(liveStats, reportTerms)}
              disabled={skillStats.length === 0}
              title={skillStats.length === 0 ? "No skills logged yet to report on" : "Download a course preferences report (.xlsx)"}
              className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink disabled:opacity-40"
            >
              <FileDown size={15} /> Generate Report
            </button>
            <div className="flex items-center gap-2 bg-ok/10 border border-ok/30 rounded-full px-3 py-[6px] text-[12px] text-ok">
              <span className="w-[7px] h-[7px] rounded-full bg-ok animate-pulse" /> LIVE
            </div>
          </div>
        }
      />

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {liveStats.map((s) => (
          <Panel key={s.label} className="p-5">
            <div className="eyebrow">{s.label}</div>
            <div className={`font-serif text-[26px] font-bold mt-3 ${s.tone === "gold" ? "text-gold" : "text-info"}`}>{s.value}</div>
            <div className="text-ok text-[12px] mt-2">{s.sub}</div>
          </Panel>
        ))}
      </div>

      {skillStats.length === 0 ? (
        <Panel className="p-16 text-center text-mut text-[13px] mt-6">No skills logged by your students yet.</Panel>
      ) : (
        <>
          {/* top skills bar */}
          <Panel className="p-6 mt-6">
            <h2 className="font-serif text-[22px] font-bold text-ink">Top Skills by Frequency</h2>
            <p className="text-mut text-[12px] mt-1">How many students list each skill on their profile</p>
            <div className="mt-5 flex flex-col gap-[14px]">
              {skillStats.slice(0, 10).map((s) => (
                <div key={s.skill}>
                  <div className="flex items-center justify-between mb-[6px]">
                    <span className="text-ink text-[13px]">{s.skill}</span>
                    <span className="text-[13px] font-semibold text-gold">{s.count}</span>
                  </div>
                  <div className="h-[6px] rounded-full bg-surface3 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-golddeep to-goldbright"
                      style={{ width: `${Math.max((s.count / maxCount) * 100, 3)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* ranked skill list */}
          <Panel className="p-6 mt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-[22px] font-bold text-ink">Top Skills Among Our Students</h2>
              <div className="flex items-center gap-2 bg-surface2 border border-line rounded-lg px-3 py-[7px]">
                <Search size={14} className="text-mut" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter skills..."
                  className="bg-transparent outline-none text-ink text-[13px] w-[120px] placeholder:text-mut"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-1 mt-5">
              {[left, right].map((col, ci) => (
                <div key={ci}>
                  {col.map((s) => (
                    <div key={s.skill} className="flex items-center gap-4 py-4 border-t border-line/60">
                      <span className="text-mut font-mono text-[13px] w-4">{s.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-ink text-[14px] font-medium">{s.skill}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-ink font-semibold text-[14px]">{s.count} students</div>
                        <div className="text-dim text-[11px] mt-[2px]">{s.pctOfStudents}% coverage</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </>
  );
}

/* ================================================================ MOCK PREFERENCES */
function MockPreferences() {
  const [query, setQuery] = useState("");
  const terms = searchTerms.filter((t) => t.term.toLowerCase().includes(query.toLowerCase()));
  const left = terms.filter((_, i) => i % 2 === 0);
  const right = terms.filter((_, i) => i % 2 === 1);

  return (
    <>
      <PageHeader
        title="Course Preferences"
        subtitle="Student search behaviour & course interest signals · Demo data"
        action={
          <button
            onClick={() => generatePreferencesReport(prefStats, searchTerms)}
            title="Download a course preferences report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {prefStats.map((s) => (
          <Panel key={s.label} className="p-5">
            <div className="eyebrow">{s.label}</div>
            <div className={`font-serif text-[26px] font-bold mt-3 ${s.tone === "gold" ? "text-gold" : "text-info"}`}>{s.value}</div>
            <div className="text-ok text-[12px] mt-2">{s.sub}</div>
          </Panel>
        ))}
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Weekly Search Volume</h2>
          <p className="text-mut text-[12px] mt-1">Tech · Finance · Consulting categories</p>
          <div className="mt-4"><SearchVolumeArea /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Course Interest Score</h2>
          <p className="text-mut text-[12px] mt-1">Based on job search & profile engagement</p>
          <div className="mt-4"><InterestScoreBars /></div>
        </Panel>
      </div>

      {/* top search terms */}
      <Panel className="p-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[22px] font-bold text-ink">Top Student Search Terms</h2>
          <div className="flex items-center gap-2 bg-surface2 border border-line rounded-lg px-3 py-[7px]">
            <Search size={14} className="text-mut" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter terms..."
              className="bg-transparent outline-none text-ink text-[13px] w-[120px] placeholder:text-mut"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-1 mt-5">
          {[left, right].map((col, ci) => (
            <div key={ci}>
              {col.map((t) => (
                <div key={t.rank} className="flex items-center gap-4 py-4 border-t border-line/60">
                  <span className="text-mut font-mono text-[13px] w-4">{t.rank}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-mono text-[9px] tracking-wide px-2 py-[2px] rounded uppercase" style={{ color: t.categoryColor, backgroundColor: `${t.categoryColor}1a` }}>{t.category}</span>
                    <div className="text-ink text-[14px] font-medium mt-[6px]">{t.term}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-ink font-semibold text-[14px]">{t.count}</div>
                    <div className="text-ok text-[11px] mt-[2px]">+{t.delta}%</div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </Panel>
    </>
  );
}
