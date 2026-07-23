"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Plus, MapPin, Users, Clock, ChevronLeft, ChevronRight, X, Check, Loader2, Radio, MessageSquare } from "lucide-react";
import { PageHeader, Panel } from "@/components/ui";
import MatchChat from "@/components/MatchChat";
import { jobRoles, traitEmoji } from "@/lib/mock";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  getMyCompany,
  getCompanyMatches,
  getCompanyRoles,
  createRole,
  setMatchStage,
  subscribeCompanyMatches,
  type Company,
  type Role,
} from "@/lib/employer";
import type { JobRole, HireStage, MatchedCandidate } from "@/lib/types";

const STAGE_COLOR: Record<string, string> = {
  Applied: "text-mut",
  Screening: "text-gold",
  Interview: "text-info",
  "Final Round": "text-[#a78bfa]",
  Offer: "text-ok",
};

// Board columns, in pipeline order. Hired / Rejected are terminal (off-board).
const STAGE_ORDER: HireStage[] = ["Applied", "Screening", "Interview", "Final Round", "Offer"];

export default function HiringPage() {
  // Live matched candidates for the employer's company (Supabase). When the
  // signed-in employer owns a company we always show the live board — even with
  // zero matches yet — so new matches can stream in. Otherwise (Supabase off, or
  // no owned company) we fall back to the mock board below.
  const [company, setCompany] = useState<Company | null>(null);
  const [liveMatches, setLiveMatches] = useState<MatchedCandidate[]>([]);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    Promise.all([getMyCompany(), getCompanyMatches()])
      .then(([c, m]) => {
        setCompany(c);
        setLiveMatches(m);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <PageHeader title="Hiring" subtitle="Manage job postings and track applicant pipelines" />
        <Panel className="p-16 flex items-center justify-center">
          <Loader2 size={22} className="animate-spin text-gold" />
        </Panel>
      </>
    );
  }

  if (company) {
    return <LiveMatchBoard company={company} initial={liveMatches} />;
  }

  return <MockHiringBoard />;
}

/* ============================================================ LIVE MATCH BOARD */
function LiveMatchBoard({ company, initial }: { company: Company; initial: MatchedCandidate[] }) {
  const [cands, setCands] = useState<MatchedCandidate[]>(initial);
  const [roles, setRoles] = useState<Role[]>([]);
  const [composing, setComposing] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  // The matched candidate whose chat thread is open, or null.
  const [chatWith, setChatWith] = useState<MatchedCandidate | null>(null);

  // The company's open job postings, shown above the pipeline.
  useEffect(() => {
    getCompanyRoles(company.id).then(setRoles);
  }, [company.id]);

  async function postRole(input: Parameters<typeof createRole>[1]) {
    const created = await createRole(company.id, input);
    setRoles((rs) => [...rs, created]); // append: getCompanyRoles orders oldest-first
    setComposing(false);
  }

  // Keep the latest `busy` readable inside the subscription callback without
  // resubscribing on every stage move.
  const busyRef = useRef<string | null>(null);
  useEffect(() => {
    busyRef.current = busy;
  }, [busy]);

  // Real-time: re-fetch the enriched match list whenever a `matches` row for
  // this company changes (a candidate mutually matches, or a stage moves). The
  // realtime event carries only the raw match row, so we re-run the RPC to pull
  // names/traits/scores. Skip while a local stage move is in flight so the
  // optimistic UI isn't clobbered mid-update.
  useEffect(() => {
    const unsub = subscribeCompanyMatches(company.id, () => {
      if (busyRef.current) return;
      getCompanyMatches().then(setCands);
    });
    return unsub;
  }, [company.id]);

  async function move(c: MatchedCandidate, stage: HireStage) {
    const prev = cands;
    setBusy(c.matchId);
    setCands((cs) => cs.map((x) => (x.matchId === c.matchId ? { ...x, stage } : x))); // optimistic
    try {
      await setMatchStage(c.matchId, stage);
    } catch {
      setCands(prev); // revert on failure
    } finally {
      setBusy(null);
    }
  }

  const active = cands.filter((c) => STAGE_ORDER.includes(c.stage));
  const hired = cands.filter((c) => c.stage === "Hired").length;
  const rejected = cands.filter((c) => c.stage === "Rejected").length;

  return (
    <>
      <PageHeader
        title="Hiring"
        subtitle={`Matched candidates for ${company.name} — move them through your pipeline`}
        action={
          <span className="flex items-center gap-2 bg-ok/10 border border-ok/30 rounded-full px-3 py-[7px] text-ok text-[12px] font-semibold">
            <Radio size={13} className="animate-pulse" /> Live
          </span>
        }
      />

      <div className="flex items-center gap-6 mb-6">
        <Stat label="Open Roles" value={roles.length} />
        <Stat label="Matched" value={cands.length} />
        <Stat label="In Pipeline" value={active.length} tone="text-gold" />
        <Stat label="Hired" value={hired} tone="text-ok" />
        <Stat label="Rejected" value={rejected} tone="text-mut" />
      </div>

      <Panel className="p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-[20px] font-bold text-ink">Open Roles</h2>
            <p className="text-mut text-[12px] mt-1">Live postings at {company.name}</p>
          </div>
          <button
            onClick={() => setComposing((v) => !v)}
            className="flex items-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl px-4 py-[10px] font-semibold text-[13px]"
            style={{ color: "#2b2106" }}
          >
            <Plus size={16} /> Post New Role
          </button>
        </div>

        {composing && <LiveRoleForm onCreate={postRole} onCancel={() => setComposing(false)} />}

        {roles.length === 0 ? (
          <div className="border border-dashed border-line rounded-xl py-10 text-center text-mut text-[13px]">
            No open roles yet. Post your first opening to start attracting matches.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {roles.map((r) => (
              <div key={r.id} className="bg-surface2 border border-line rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-ink font-semibold text-[15px]">{r.title}</span>
                  {r.package && <span className="text-gold text-[13px] font-semibold shrink-0">{r.package}</span>}
                </div>
                <div className="flex items-center gap-3 mt-2 text-mut text-[12px]">
                  {r.location && <span className="flex items-center gap-1"><MapPin size={12} /> {r.location}</span>}
                  {r.type && <span>{r.type}</span>}
                </div>
                {r.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {r.tags.map((t) => (
                      <span key={t} className="text-dim text-[11px] bg-surface3 border border-line rounded-full px-2 py-[3px]">{t}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel className="p-6">
        {active.length === 0 ? (
          <div className="py-16 text-center text-mut text-[13px]">
            No candidates in the active pipeline. Hired and rejected candidates are archived.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {STAGE_ORDER.map((stage, stageIdx) => {
              const col = active.filter((c) => c.stage === stage);
              const isFirst = stageIdx === 0;
              const isLast = stageIdx === STAGE_ORDER.length - 1;
              return (
                <div key={stage}>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`font-mono text-[10px] uppercase tracking-wider ${STAGE_COLOR[stage] ?? "text-mut"}`}>{stage}</span>
                    <span className="text-mut text-[11px] bg-surface2 border border-line rounded-full w-5 h-5 flex items-center justify-center">{col.length}</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {col.map((c) => (
                      <div key={c.matchId} className={`bg-surface2 border border-line rounded-xl p-3 ${busy === c.matchId ? "opacity-60" : ""}`}>
                        <div className="flex items-center gap-2">
                          <span className="text-[15px]">{c.trait ? traitEmoji[c.trait] ?? "•" : "•"}</span>
                          <span className="text-ink text-[13px] font-semibold truncate">{c.name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-dim text-[12px]">{c.trait ?? "—"}</span>
                          <span className={`text-[12px] font-semibold ${c.score >= 90 ? "text-ok" : "text-gold"}`}>{c.score}%</span>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-[10px] border-t border-line">
                          <button
                            onClick={() => move(c, STAGE_ORDER[stageIdx - 1])}
                            disabled={isFirst || busy === c.matchId}
                            title="Move back a stage"
                            className="p-1 rounded-md text-mut hover:text-ink hover:bg-surface3 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-mut"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            onClick={() => move(c, "Rejected")}
                            disabled={busy === c.matchId}
                            title="Reject candidate"
                            className="p-1 rounded-md text-mut hover:text-danger hover:bg-danger/10 disabled:opacity-40"
                          >
                            <X size={15} />
                          </button>
                          {isLast ? (
                            <button
                              onClick={() => move(c, "Hired")}
                              disabled={busy === c.matchId}
                              title="Mark as hired"
                              className="flex items-center gap-1 px-2 py-1 rounded-md text-ok hover:bg-ok/10 text-[11px] font-semibold disabled:opacity-40"
                            >
                              <Check size={14} /> Hire
                            </button>
                          ) : (
                            <button
                              onClick={() => move(c, STAGE_ORDER[stageIdx + 1])}
                              disabled={busy === c.matchId}
                              title="Advance to next stage"
                              className="p-1 rounded-md text-gold hover:bg-gold/10 disabled:opacity-40"
                            >
                              <ChevronRight size={15} />
                            </button>
                          )}
                        </div>
                        <button
                          onClick={() => setChatWith(c)}
                          title={`Message ${c.name}`}
                          className="mt-[10px] w-full flex items-center justify-center gap-1.5 rounded-md py-[6px] bg-gold/[0.12] border border-gold/30 text-goldbright text-[11px] font-semibold hover:bg-gold/20"
                        >
                          <MessageSquare size={13} /> Message
                        </button>
                      </div>
                    ))}
                    {col.length === 0 && (
                      <div className="border border-dashed border-line rounded-xl py-4 text-center text-mut text-[11px]">Empty</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Panel>

      <MatchChat
        matchId={chatWith?.matchId ?? null}
        title={chatWith?.name ?? ""}
        subtitle={chatWith?.headline ?? chatWith?.trait ?? undefined}
        initials={chatWith?.initials ?? "•"}
        onClose={() => setChatWith(null)}
      />
    </>
  );
}

/* -------------------------------------- inline "post new role" form (live/DB) */
function LiveRoleForm({
  onCreate,
  onCancel,
}: {
  onCreate: (input: Parameters<typeof createRole>[1]) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState("Full-time");
  const [pkg, setPkg] = useState("");
  const [tags, setTags] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const field =
    "bg-surface2 border border-line rounded-xl px-4 py-[11px] text-ink text-[14px] outline-none placeholder:text-mut focus:border-gold/50";

  async function submit() {
    if (!title.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onCreate({
        title: title.trim(),
        location: location.trim() || null,
        type,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        package: pkg.trim() || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't post the role. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="border border-line rounded-2xl bg-surface p-5 mb-5">
      <h3 className="font-serif text-[17px] font-bold text-ink mb-4">Post a new role</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Role title *" className={field} />
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" className={field} />
        <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
          <option>Full-time</option>
          <option>Hybrid</option>
          <option>Remote</option>
        </select>
        <input value={pkg} onChange={(e) => setPkg(e.target.value)} placeholder="Package (e.g. $120K)" className={field} />
        <input value={salaryMin} onChange={(e) => setSalaryMin(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Salary min" className={field} />
        <input value={salaryMax} onChange={(e) => setSalaryMax(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Salary max" className={field} />
        <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" className={`${field} sm:col-span-2 lg:col-span-3`} />
      </div>

      {error && <p className="mt-4 text-[13px] text-danger bg-danger/10 border border-danger/30 rounded-xl px-4 py-3">{error}</p>}

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={submit}
          disabled={!title.trim() || busy}
          className="flex items-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl px-4 py-[10px] font-semibold text-[13px] disabled:opacity-40"
          style={{ color: "#2b2106" }}
        >
          {busy ? <><Loader2 size={15} className="animate-spin" /> Posting…</> : "Create role"}
        </button>
        <button onClick={onCancel} disabled={busy} className="text-mut hover:text-ink text-[13px] px-2 disabled:opacity-40">
          Cancel
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, tone = "text-ink" }: { label: string; value: number; tone?: string }) {
  return (
    <div>
      <div className={`font-serif text-[24px] font-bold ${tone}`}>{value}</div>
      <div className="eyebrow">{label}</div>
    </div>
  );
}

/* ======================================================= MOCK HIRING BOARD (fallback) */
// Stages a brand-new role starts with, in pipeline order.
const NEW_ROLE_STAGES: JobRole["pipeline"] = [
  { stage: "Applied", candidates: [] },
  { stage: "Screening", candidates: [] },
  { stage: "Interview", candidates: [] },
  { stage: "Final Round", candidates: [] },
  { stage: "Offer", candidates: [] },
];

function MockHiringBoard() {
  // Client-side pipeline the hiring user can control when there's no live data.
  const [roles, setRoles] = useState<JobRole[]>(() => structuredClone(jobRoles));
  const [selectedId, setSelectedId] = useState(roles[0].id);
  const [query, setQuery] = useState("");
  const [composing, setComposing] = useState(false);

  const role = roles.find((r) => r.id === selectedId) ?? roles[0];
  const filtered = roles.filter((r) => r.title.toLowerCase().includes(query.toLowerCase()));

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

  function moveCandidate(roleId: string, stageIdx: number, candIdx: number, dir: 1 | -1) {
    mutateRole(roleId, (r) => {
      const target = stageIdx + dir;
      if (target < 0 || target >= r.pipeline.length) return;
      const [cand] = r.pipeline[stageIdx].candidates.splice(candIdx, 1);
      r.pipeline[target].candidates.push(cand);
    });
  }

  function rejectCandidate(roleId: string, stageIdx: number, candIdx: number) {
    mutateRole(roleId, (r) => {
      r.pipeline[stageIdx].candidates.splice(candIdx, 1);
      r.applicants = Math.max(0, r.applicants - 1);
    });
  }

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
                      <div className="border border-dashed border-line rounded-xl py-4 text-center text-mut text-[11px]">Empty</div>
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
