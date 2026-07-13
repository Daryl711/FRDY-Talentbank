"use client";

import { useState } from "react";
import { Search, TrendingUp } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { InterestScoreBars, SearchVolumeArea } from "@/components/university/UniCharts";
import { prefStats, searchTerms } from "@/lib/university";

export default function CoursePreferencesPage() {
    const [query, setQuery] = useState("");
    const terms = searchTerms.filter((t) => t.term.toLowerCase().includes(query.toLowerCase()));
    const left = terms.filter((_, i) => i % 2 === 0);
    const right = terms.filter((_, i) => i % 2 === 1);

    return (
        <>
            <PageHeader
                title="Course Preferences"
                subtitle="Student search behaviour & course interest signals · Live data"
                action={
                    <div className="flex items-center gap-2 bg-ok/10 border border-ok/30 rounded-full px-3 py-[6px] text-[12px] text-ok">
                        <span className="w-[7px] h-[7px] rounded-full bg-ok animate-pulse" /> LIVE
                    </div>
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
                            <div className="flex items-center justify-end gap-1 text-ok text-[11px] mt-[2px]">
                            <TrendingUp size={11} /> +{t.delta}%
                            </div>
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