"use client";

import { useState } from "react";
import { Search, Plus, MapPin, Users, Clock, ChevronLeft, ChevronRight, X, Check } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import { jobRoles, traitEmoji } from "@/lib/mock";
import type { JobRole } from "@/lib/types";

const STAGE_COLOR: Record<string, string> = {
  Applied: "text-mut",
  Screening: "text-gold",
  Interview: "text-info",
  "Final Round": "text-[#a78bfa]",
  Offer: "text-ok",
};

// Stages a brand-new role starts with, in pipeline order.
const NEW_ROLE_STAGES: JobRole["pipeline"] = [
  { stage: "Applied", candidates: [] },
  { stage: "Screening", candidates: [] },
  { stage: "Interview", candidates: [] },
  { stage: "Final Round", candidates: [] },
  { stage: "Offer", candidates: [] },
];

export default function HiringPage() {
  // Pipeline state is owned here so the hiring user can move candidates between
  // stages, reject them, mark hires, and post new roles — all client-side.
  const [roles, setRoles] = useState<JobRole[]>(() => structuredClone(jobRoles));
  const [selectedId, setSelectedId] = useState(roles[0].id);
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);

  const role = roles.find((r) => r.id === selectedId) ?? roles[0];
  const filtered = roles.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

  // Apply an immutable update to a single role by id.
  function mutateRole(roleId: string, fn: (r: JobRole) => void) {
    setRoles((rs) =>
      rs.map((r) => {
        if (r.id !== roleId) return r;
        const clone = structuredClone(r);
        fn(clone);
        return clone;
      }),
    );
  }

  // Move a candidate one stage forward (+1) or back (-1).
  function moveCandidate(roleId: string, stageIdx: number, candIdx: number, dir: 1 | -1) {
    mutateRole(roleId, (r) => {
      const target = stageIdx + dir;
      if (target < 0 || target >= r.pipeline.length) return;
      const [cand] = r.pipeline[stageIdx].candidates.splice(candIdx, 1);
      r.pipeline[target].candidates.push(cand);
    });
  }

  // Reject removes the candidate and drops the applicant count.
  function rejectCandidate(roleId: string, stageIdx: number, candIdx: number) {
    mutateRole(roleId, (r) => {
      r.pipeline[stageIdx].candidates.splice(candIdx, 1);
      r.applicants = Math.max(0, r.applicants - 1);
    });
  }

  // Hire removes the candidate from the (final) stage — the offer was accepted.
  function hireCandidate(roleId: string, stageIdx: number, candIdx: number) {
    mutateRole(roleId, (r) => {
      r.pipeline[stageIdx].candidates.splice(candIdx, 1);
    });
  }

  function createRole(form: { title: string; dept: string; location: string; type: string }) {
    const newRole: JobRole = {
      id: `j-${Date.now()}`,
      title: form.title.trim() || "Untitled Role",
      dept: form.dept.trim() || "General",
      status: "Active",
      applicants: 0,
      daysOpen: 0,
      location: form.location.trim() || "Remote",
      type: form.type || "Full-time",
      pipeline: structuredClone(NEW_ROLE_STAGES),
    };
    setRoles((rs) => [newRole, ...rs]);
    setSelectedId(newRole.id);
    setComposing(false);
  }

  return (
    <>
      <PageHeader
        title="Hiring"
        subtitle="Manage job postings and track applicant pipelines"
        action={
          <button
            onClick={() => setComposing((v) => !v)}
            className="flex items-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl px-4 py-[11px] font-semibold text-[14px]"
            style={{ color: "#2b2106" }}
          >
            <Plus size={17} /> Post New Role
          </button>
        }
      />

      {composing && <NewRoleForm onCreate={createRole} onCancel={() => setComposing(false)} />}

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
            {role.pipeline.map((col, stageIdx) => {
              const isFirst = stageIdx === 0;
              const isLast = stageIdx === role.pipeline.length - 1;
              return (
                <div key={col.stage}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${STAGE_COLOR[col.stage] ?? "text-mut"}`}>{col.stage}</span>
                    <span className="text-mut text-[11px] bg-surface2 border border-line rounded-full w-5 h-5 flex items-center justify-center">{col.candidates.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {col.candidates.map((c, candIdx) => (
                      <div key={c.name} className="bg-surface2 border border-line rounded-xl p-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px]">{traitEmoji[c.trait]}</span>
                          <span className="text-ink text-[13px] font-semibold">{c.name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-dim text-[12px]">{c.trait}</span>
                          <span className={`text-[12px] font-semibold ${c.match >= 90 ? "text-ok" : "text-gold"}`}>{c.match}%</span>
                        </div>

                        {/* pipeline controls */}
                        <div className="flex items-center justify-between mt-3 pt-[10px] border-t border-line">
                          <button
                            onClick={() => moveCandidate(role.id, stageIdx, candIdx, -1)}
                            disabled={isFirst}
                            title="Move back a stage"
                            className="p-1 rounded-md text-mut hover:text-ink hover:bg-surface3 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-mut"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            onClick={() => rejectCandidate(role.id, stageIdx, candIdx)}
                            title="Reject candidate"
                            className="p-1 rounded-md text-mut hover:text-danger hover:bg-danger/10"
                          >
                            <X size={15} />
                          </button>
                          {isLast ? (
                            <button
                              onClick={() => hireCandidate(role.id, stageIdx, candIdx)}
                              title="Mark as hired"
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-ok hover:bg-ok/10 text-[11px] font-semibold"
                            >
                              <Check size={14} /> Hire
                            </button>
                          ) : (
                            <button
                              onClick={() => moveCandidate(role.id, stageIdx, candIdx, 1)}
                              title="Advance to next stage"
                              className="p-1 rounded-md text-gold hover:bg-gold/10"
                            >
                              <ChevronRight size={15} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {col.candidates.length === 0 && (
                      <div className="border border-dashed border-line rounded-xl py-4 text-center text-mut text-[11px]">
                        Empty
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
      </div>
    </>
  );
}

/* ------------------------------------------------ inline "post new role" form */
function NewRoleForm({
  onCreate,
  onCancel,
}: {
  onCreate: (form: { title: string; dept: string; location: string; type: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [dept, setDept] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-time");

  const field = "bg-surface2 border border-line rounded-xl px-4 py-[11px] text-ink text-[14px] outline-none placeholder:text-mut focus:border-gold/50";

  return (
    <Panel className="p-5 mb-6">
      <h3 className="font-serif text-[18px] font-bold text-ink mb-4">Post a new role</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role title" className={field} />
        <input value={dept} onChange={(e) => setDept(e.target.value)} placeholder="Department" className={field} />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={field} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
          <option>Full-time</option>
          <option>Hybrid</option>
          <option>Remote</option>
        </select>
      </div>
      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={() => onCreate({ title, dept, location, type })}
          disabled={!title.trim()}
          className="bg-gradient-to-r from-goldbright to-golddeep rounded-xl px-4 py-[10px] font-semibold text-[13px] disabled:opacity-40"
          style={{ color: "#2b2106" }}
        >
          Create role
        </button>
        <button onClick={onCancel} className="text-mut hover:text-ink text-[13px] px-2">
          Cancel
        </button>
      </div>
    </Panel>
  );
}
