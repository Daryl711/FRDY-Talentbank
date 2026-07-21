"use client";

import { useEffect, useState } from "react";
import { Search, MessageSquare, Check } from "lucide-react";
import { getConnections, type Connection } from "@/lib/candidate";

type Seg = Connection["kind"];
const SEGMENTS: { key: Seg; label: string; badge?: string }[] = [
  { key: "network", label: "Network" },
  { key: "requests", label: "Requests", badge: "2" },
  { key: "discover", label: "Discover" },
];

export default function ConnectPage() {
  const [seg, setSeg] = useState<Seg>("network");
  const [people, setPeople] = useState<Connection[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    getConnections(seg).then(setPeople);
  }, [seg]);

  const q = query.trim().toLowerCase();
  const filtered = q ? people.filter((p) => `${p.name} ${p.role}`.toLowerCase().includes(q)) : people;

  return (
    <div className="max-w-[760px] mx-auto">
      <header>
        <h1 className="font-serif text-[32px] font-bold text-ink">Connections</h1>
        <p className="text-dim text-[13.5px] mt-2">4 connections · 2 pending requests</p>
      </header>

      <div className="flex items-center gap-3 bg-surface2 border border-line rounded-2xl px-4 py-[13px] mt-5">
        <Search size={18} className="text-mut" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your network…"
          className="flex-1 bg-transparent outline-none text-ink text-[14.5px] placeholder:text-mut"
        />
      </div>

      {/* segmented control */}
      <div className="flex gap-1 bg-surface2 border border-line rounded-xl p-[5px] mt-5">
        {SEGMENTS.map((s) => {
          const on = seg === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSeg(s.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-[9px] rounded-lg font-mono text-[11px] tracking-wide uppercase transition-colors ${on ? "font-bold" : "text-dim"}`}
              style={on ? { backgroundColor: "#d8b45a", color: "#3a2d08" } : undefined}
            >
              {s.label}
              {s.badge && <span className="rounded-full px-[6px] text-[9px]" style={{ backgroundColor: on ? "#3a2d08" : "#1b2742", color: "#e8c873" }}>{s.badge}</span>}
            </button>
          );
        })}
      </div>

      {/* people */}
      <div className="flex flex-col gap-3 mt-4">
        {filtered.map((p) => {
          const isReq = seg === "requests";
          return (
            <div key={p.id} className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4">
              <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[15px] shrink-0" style={{ backgroundColor: p.color }}>
                {p.initials}
                {p.online && <span className="absolute -bottom-[2px] -right-[2px] w-3 h-3 rounded-full bg-ok border-2 border-surface" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15.5px] text-ink truncate">{p.name}</div>
                <div className="text-dim text-[12.5px] mt-[3px] truncate">{p.role}</div>
                <div className="text-gold font-mono text-[10.5px] mt-[6px]">{p.mutual}</div>
              </div>
              <button className="w-10 h-10 rounded-xl flex items-center justify-center text-gold" style={{ backgroundColor: "rgba(216,180,90,0.1)", border: "1px solid rgba(216,180,90,0.25)" }}>
                {isReq ? <Check size={18} /> : <MessageSquare size={18} />}
              </button>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-surface border border-line rounded-2xl py-10 text-center text-dim text-[14px]">No connections here yet.</div>
        )}
      </div>
    </div>
  );
}
