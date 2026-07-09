"use client";

import { useState } from "react";
import { PageHeader, Panel } from "@/components/ui";
import TraitDonut from "@/components/TraitDonut";
import TraitRadar from "@/components/TraitRadar";
import { traitStats, traitCandidates, traitsProfiled, traitEmoji } from "@/lib/mock";

export default function AnimalTraitsPage() {
  const [selectedId, setSelectedId] = useState(traitCandidates[0].id);
  const selected = traitCandidates.find((c) => c.id === selectedId) ?? traitCandidates[0];

  return (
    <>
      <PageHeader title="Animal Traits" subtitle={`Personality archetypes across your candidates — ${traitsProfiled} profiled`} />

      {/* trait summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {traitStats.map((t) => (
          <Panel key={t.trait} className="p-5 text-center">
            <div className="text-[34px] leading-none">{traitEmoji[t.trait]}</div>
            <div className="font-semibold text-ink text-[15px] mt-3">{t.trait}</div>
            <div className="font-serif text-[26px] font-bold mt-2" style={{ color: t.color }}>{t.pct}%</div>
            <div className="eyebrow mt-2">{t.count} candidates</div>
          </Panel>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* distribution */}
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Trait Distribution</h2>
          <p className="text-mut text-[12px] mt-1">All candidates · active profiles</p>
          <div className="mt-4">
            <TraitDonut />
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 mt-4">
            {traitStats.map((t) => (
              <div key={t.trait} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-dim text-[13px]">
                  <span className="w-[10px] h-[10px] rounded-full" style={{ backgroundColor: t.color }} />
                  {traitEmoji[t.trait]} {t.trait}
                </span>
                <span className="text-[13px] font-semibold" style={{ color: t.color }}>{t.pct}%</span>
              </div>
            ))}
          </div>
        </Panel>

        {/* candidate list + selected */}
        <div className="flex flex-col gap-6">
          <Panel className="p-6">
            <h2 className="font-serif text-[22px] font-bold text-ink mb-4">All Candidates</h2>
            <div className="flex flex-col gap-2">
              {traitCandidates.map((c) => {
                const on = c.id === selectedId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors border ${
                      on ? "bg-gold/[0.06] border-gold/40" : "border-transparent hover:bg-surface2"
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-info/20 text-info flex items-center justify-center text-[12px] font-bold">{c.initials}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-ink text-[14px] font-semibold">{c.name}</div>
                      <div className="text-dim text-[12px]">{c.role}</div>
                    </div>
                    <span className="text-[18px]">{traitEmoji[c.trait]}</span>
                    <span className={`text-[13px] font-semibold ${c.match >= 90 ? "text-ok" : "text-gold"}`}>{c.match}%</span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-gold/15 flex items-center justify-center text-[22px]">{traitEmoji[selected.trait]}</div>
              <div>
                <div className="font-serif text-[19px] font-bold text-ink">{selected.name}</div>
                <div className="eyebrow !text-gold mt-[2px]">{selected.archetype}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5 items-center">
              <div className="flex flex-col gap-[10px]">
                {selected.tags.map((tag) => (
                  <div key={tag} className="bg-surface2 border border-line rounded-lg px-3 py-[9px] text-dim text-[13px]">{tag}</div>
                ))}
              </div>
              <TraitRadar data={selected.radar} />
            </div>
          </Panel>
        </div>
      </div>
    </>
  );
}
