"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Bell, Bookmark, MapPin, Clock, ChevronRight, TrendingUp, Briefcase, Star, X, ArrowRight } from "lucide-react";
import {
  careerInsights, getFeaturedRoles, getMyProfile, getSavedJobs, toggleSavedJob, trendingSectors, unsaveJob,
  type CandidateProfile, type Role,
} from "@/lib/candidate";

const fmtK = (n: number) => `$${Math.round(n / 1000)}K`;

function greetingForNow(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

/** Stash a role for the Match deck to bring to the top, then navigate there. */
function focusJob(router: ReturnType<typeof useRouter>, r: Role) {
  const payload = { id: r.id, name: r.company, initials: r.initials, role: r.title, location: r.location, match: r.match, package: fmtK(r.salary_max) };
  if (typeof window !== "undefined") window.sessionStorage.setItem("mango.focus_job", JSON.stringify(payload));
  router.push("/candidate/match");
}

export default function CandidateHome() {
  const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [me, setMe] = useState<CandidateProfile | null>(null);
  const [query, setQuery] = useState("");
  const [savedJobs, setSavedJobs] = useState<Role[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const savedIds = useMemo(() => new Set(savedJobs.map((r) => r.id)), [savedJobs]);

  useEffect(() => {
    getFeaturedRoles().then(setRoles);
    getMyProfile().then(setMe);
    setSavedJobs(getSavedJobs());
  }, []);

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const filtered = useMemo(
    () => (searching ? roles.filter((r) => `${r.title} ${r.company} ${r.location} ${r.type}`.toLowerCase().includes(q)) : roles),
    [roles, q, searching],
  );

  const featured = searching ? undefined : filtered[0];
  const rest = searching ? filtered : filtered.slice(1);

  const topMatch = roles.length ? Math.max(...roles.map((r) => r.match)) : 0;
  const avgSalary = roles.length ? Math.round(roles.reduce((s, r) => s + (r.salary_min + r.salary_max) / 2, 0) / roles.length) : 0;

  function toggleSave(role: Role) {
    setSavedJobs(toggleSavedJob(role).jobs);
  }

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* greeting */}
      <header className="flex items-start justify-between">
        <div>
          <div className="eyebrow mb-1">{greetingForNow()}</div>
          <h1 className="font-serif text-[32px] font-bold text-ink">{me?.name ?? "Welcome"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSavedOpen(true)}
            className="relative w-11 h-11 rounded-full bg-surface2 border border-line flex items-center justify-center text-dim hover:text-ink"
          >
            <Bookmark size={18} />
            {savedJobs.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gold text-[10px] font-bold flex items-center justify-center" style={{ color: "#3a2d08" }}>
                {savedJobs.length}
              </span>
            )}
          </button>
          <button className="relative w-11 h-11 rounded-full bg-surface2 border border-line flex items-center justify-center text-dim hover:text-ink">
            <Bell size={18} />
            <span className="absolute top-2 right-[10px] w-[7px] h-[7px] rounded-full bg-gold" />
          </button>
          <button
            onClick={() => router.push("/candidate/profile")}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-goldbright to-golddeep flex items-center justify-center text-[13px] font-bold"
            style={{ color: "#2b2106" }}
          >
            {me?.initials ?? "•"}
          </button>
        </div>
      </header>

      {/* search */}
      <div className="flex items-center gap-3 bg-surface2 border border-line rounded-2xl px-4 py-3 mt-6">
        <Search size={18} className="text-mut" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search roles, companies, skills…"
          className="flex-1 bg-transparent outline-none text-ink text-[14.5px] placeholder:text-mut"
        />
        {searching && (
          <button onClick={() => setQuery("")} className="text-mut hover:text-ink">
            <X size={16} />
          </button>
        )}
      </div>

      {/* stats */}
      <div className="grid grid-cols-3 gap-4 mt-5">
        <StatTile icon={<Briefcase size={18} className="text-gold" />} value="2,840" label="Active Roles" />
        <StatTile icon={<TrendingUp size={18} className="text-gold" />} value={avgSalary ? fmtK(avgSalary) : "—"} label="Avg. Salary" />
        <StatTile icon={<Star size={18} className="text-gold" />} value={topMatch ? `${topMatch}%` : "—"} label="Top Match" />
      </div>

      {/* roles */}
      <div className="flex items-center justify-between mt-9 mb-4">
        <h2 className="font-serif text-[22px] font-bold text-ink">{searching ? "Results" : "Featured Roles"}</h2>
        {searching ? (
          <span className="text-mut text-[13px]">{filtered.length} {filtered.length === 1 ? "result" : "results"}</span>
        ) : (
          <button onClick={() => router.push("/candidate/match")} className="flex items-center gap-1 text-gold text-[13px] font-medium hover:text-goldbright">
            View all <ChevronRight size={15} />
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-surface border border-line rounded-2xl py-10 flex flex-col items-center gap-3">
          <Search size={22} className="text-mut" />
          <p className="text-dim text-[14px]">No roles match “{query.trim()}”.</p>
        </div>
      )}

      {/* featured hero */}
      {featured && (
        <button
          onClick={() => focusJob(router, featured)}
          className="w-full text-left rounded-3xl p-6 mb-4 border border-gold/30 bg-gradient-to-b from-surface2 to-surface hover:border-gold/50 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-[16px]" style={{ backgroundColor: featured.color }}>
              {featured.initials}
            </div>
            <span className="font-mono text-[10px] tracking-wide text-goldbright font-bold bg-gold/15 border border-gold/35 rounded-full px-3 py-[6px]">
              {featured.match}% MATCH
            </span>
          </div>
          <h3 className="font-serif text-[24px] font-semibold text-ink mt-4">{featured.title}</h3>
          <p className="text-dim text-[14px] mt-1">{featured.company}</p>
          <div className="flex gap-4 mt-4 text-dim text-[12.5px]">
            <span className="flex items-center gap-1"><MapPin size={13} /> {featured.location}</span>
            <span className="flex items-center gap-1"><Clock size={13} /> {featured.posted}</span>
          </div>
          <div className="flex items-center justify-between mt-5">
            <span className="font-serif text-[20px] text-goldbright">{fmtK(featured.salary_min)} – {fmtK(featured.salary_max)}</span>
            <span className="flex items-center gap-2 bg-gradient-to-r from-goldbright to-golddeep rounded-xl px-4 py-[10px] font-semibold text-[13px]" style={{ color: "#2b2106" }}>
              Apply Now <ArrowRight size={16} />
            </span>
          </div>
        </button>
      )}

      {/* mini roles */}
      <div className="flex flex-col gap-3">
        {rest.map((r) => {
          const isSaved = savedIds.has(r.id);
          return (
            <div key={r.id} className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4 hover:border-line2 transition-colors">
              <button onClick={() => focusJob(router, r)} className="flex items-center gap-4 flex-1 text-left min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[14px] shrink-0" style={{ backgroundColor: r.color }}>
                  {r.initials}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[15.5px] text-ink truncate">{r.title}</div>
                  <div className="text-dim text-[13px] mt-[2px]">{r.company}</div>
                  <div className="flex items-center gap-2 mt-[6px]">
                    <span className="text-gold font-semibold text-[12.5px]">{fmtK(r.salary_min)} – {fmtK(r.salary_max)}</span>
                    <span className="text-mut text-[12.5px]">{r.type}</span>
                  </div>
                </div>
              </button>
              <button onClick={() => toggleSave(r)} className={isSaved ? "text-gold" : "text-mut hover:text-dim"}>
                <Bookmark size={20} fill={isSaved ? "currentColor" : "none"} />
              </button>
            </div>
          );
        })}
      </div>

      {/* insights */}
      <h2 className="font-serif text-[22px] font-bold text-ink mt-10 mb-4">Career Insights</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {careerInsights.map((i) => (
          <div key={i.label} className="bg-surface border border-line rounded-2xl p-4">
            <div className="eyebrow">{i.label}</div>
            <div className="font-serif text-[30px] font-bold text-ink mt-2">{i.value}</div>
            <div className="text-gold text-[12px] mt-1">{i.sub}</div>
          </div>
        ))}
      </div>

      {/* trending */}
      <h2 className="font-serif text-[22px] font-bold text-ink mt-10 mb-4">Trending Sectors</h2>
      <div className="flex flex-col gap-3">
        {trendingSectors.map((s) => (
          <div key={s.name} className="bg-surface border border-line rounded-2xl px-4 py-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-[15px] text-ink">{s.name}</span>
              <span className="text-dim text-[12.5px]">{s.open} open</span>
            </div>
            <div className="h-[6px] bg-surface3 rounded-full mt-3 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-goldbright to-golddeep" style={{ width: `${s.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* saved jobs overlay */}
      {savedOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-6 bg-black/60" onClick={() => setSavedOpen(false)}>
          <div className="w-full max-w-[520px] mt-16 bg-bgtop border border-line rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-serif text-[20px] font-bold text-ink">Saved Jobs</h3>
              <button onClick={() => setSavedOpen(false)} className="text-mut hover:text-ink"><X size={20} /></button>
            </div>
            {savedJobs.length === 0 ? (
              <p className="text-dim text-[14px] py-8 text-center">No saved jobs yet. Tap the bookmark on a role to save it.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {savedJobs.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 bg-surface2 border border-line rounded-xl p-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-[13px]" style={{ backgroundColor: r.color }}>{r.initials}</div>
                    <button onClick={() => { setSavedOpen(false); focusJob(router, r); }} className="flex-1 text-left min-w-0">
                      <div className="text-ink text-[14px] font-semibold truncate">{r.title}</div>
                      <div className="text-dim text-[12.5px]">{r.company}</div>
                    </button>
                    <button onClick={() => setSavedJobs(unsaveJob(r.id))} className="text-mut hover:text-danger"><X size={16} /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatTile({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="bg-surface border border-line rounded-2xl py-4 flex flex-col items-center">
      <div className="mb-2">{icon}</div>
      <div className="font-serif text-[22px] font-bold text-gold">{value}</div>
      <div className="eyebrow mt-1">{label}</div>
    </div>
  );
}
