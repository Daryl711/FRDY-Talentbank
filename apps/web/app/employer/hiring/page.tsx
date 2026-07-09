"use client";

import { useState } from "react";
import { Search, Plus, MapPin, Users, Clock } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { jobRoles, traitEmoji } from "@/lib/mock";

const STAGE_COLOR: Record<string, string> = {
  Applied: "text-mut",
  Screening: "text-gold",
  Interview: "text-info",
  "Final Round": "text-[#a78bfa]",
  Offer: "text-ok",
};

export default function HiringPage() {
  const [selectedId, setSelectedId] = useState(jobRoles[0].id);
  const [query, setQuery] = useState("");
  const role = jobRoles.find((r) => r.id === selectedId) ?? jobRoles[0];
  const filtered = jobRoles.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <PageHeader
        title="Hiring"
        subtitle="Manage job postings and track applicant pipelines"
        action={
          <button className="flex items-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl px-4 py-[11px] font-semibold text-[14px]" style={{ color: "#2b2106" }}>
            <Plus size={17} /> Post New Role
          </button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        {/* role list */}
        <div>
          <div className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[11px] mb-4">
            <Search size={16} className="text-mut" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search roles..."
              className="bg-transparent outline-none text-ink text-[14px] w-full placeholder:text-mut"
            />
          </div>

          <div className="flex flex-col gap-3">
            {filtered.map((r) => {
              const on = r.id === selectedId;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`text-left rounded-2xl p-4 border transition-colors ${
                    on ? "border-gold bg-gold/[0.05]" : "border-line bg-surface hover:border-line2"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-ink font-semibold text-[15px]">{r.title}</span>
                    <span className={`font-mono text-[8.5px] tracking-wide px-2 py-[3px] rounded ${r.status === "Active" ? "text-ok bg-ok/10 border border-ok/30" : "text-mut bg-surface3 border border-line2"}`}>
                      {r.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-dim text-[12.5px] mt-1">{r.dept}</div>
                  <div className="flex items-center gap-4 mt-3 text-mut text-[12px]">
                    <span className="flex items-center gap-1"><Users size={12} /> {r.applicants}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> {r.daysOpen}d</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* role detail + kanban */}
        <Panel className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-serif text-[24px] font-bold text-ink">{role.title}</h2>
              <div className="flex items-center gap-4 mt-2 text-dim text-[13px]">
                <span className="flex items-center gap-1"><MapPin size={13} /> {role.location}</span>
                <span>{role.type}</span>
                <span>Dept: {role.dept}</span>
              </div>
            </div>
            <div className="flex gap-8 text-right">
              <div>
                <div className="font-serif text-[24px] font-bold text-gold">{role.applicants}</div>
                <div className="eyebrow">Applicants</div>
              </div>
              <div>
                <div className="font-serif text-[24px] font-bold text-ink">{role.daysOpen}</div>
                <div className="eyebrow">Days Open</div>
              </div>
            </div>
          </div>

          {/* kanban */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 mt-7">
            {role.pipeline.map((col) => (
              <div key={col.stage}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`font-mono text-[10px] uppercase tracking-wider ${STAGE_COLOR[col.stage] ?? "text-mut"}`}>{col.stage}</span>
                  <span className="text-mut text-[11px] bg-surface2 border border-line rounded-full w-5 h-5 flex items-center justify-center">{col.candidates.length}</span>
                </div>
                <div className="flex flex-col gap-3">
                  {col.candidates.map((c) => (
                    <div key={c.name} className="bg-surface2 border border-line rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[15px]">{traitEmoji[c.trait]}</span>
                        <span className="text-ink text-[13px] font-semibold">{c.name}</span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-dim text-[12px]">{c.trait}</span>
                        <span className={`text-[12px] font-semibold ${c.match >= 90 ? "text-ok" : "text-gold"}`}>{c.match}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}
