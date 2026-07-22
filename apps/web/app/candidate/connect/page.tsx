"use client";

import { useCallback, useEffect, useState } from "react";
import { Search, MessageSquare, Check, X, UserPlus, Clock, Loader2 } from "lucide-react";
import ChatDialog from "@/components/candidate/ChatDialog";
import {
  acceptConnection,
  addConnection,
  declineConnection,
  getConnections,
  getRequestCount,
  subscribeConnections,
  type Connection,
} from "@/lib/candidate";

type Seg = Connection["kind"];
const SEGMENTS: { key: Seg; label: string }[] = [
  { key: "network", label: "Network" },
  { key: "requests", label: "Requests" },
  { key: "discover", label: "Discover" },
];

export default function ConnectPage() {
  const [seg, setSeg] = useState<Seg>("network");
  const [people, setPeople] = useState<Connection[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [requestCount, setRequestCount] = useState(0);
  const [networkCount, setNetworkCount] = useState(0);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [chatPeer, setChatPeer] = useState<Connection | null>(null);

  // No synchronous setState here — the spinner is turned on by the segment
  // button handler; this only swaps in the result and clears the spinner.
  const loadSegment = useCallback((s: Seg) => {
    getConnections(s)
      .then(setPeople)
      .finally(() => setLoading(false));
  }, []);

  const loadBadges = useCallback(() => {
    getRequestCount().then(setRequestCount);
    getConnections("network").then((n) => setNetworkCount(n.length));
  }, []);

  useEffect(() => {
    loadSegment(seg);
  }, [seg, loadSegment]);

  useEffect(() => {
    loadBadges();
    // Live: someone adds/accepts me → refresh the badge and the visible list.
    const unsubscribe = subscribeConnections(() => {
      loadBadges();
      loadSegment(seg);
    });
    return unsubscribe;
  }, [seg, loadBadges, loadSegment]);

  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusy((b) => new Set(b).add(id));
    try {
      await fn();
    } finally {
      setBusy((b) => {
        const next = new Set(b);
        next.delete(id);
        return next;
      });
    }
  };

  const onAdd = (p: Connection) =>
    withBusy(p.id, async () => {
      const connId = await addConnection(p.id);
      setRequested((r) => new Set(r).add(p.id));
      if (connId) {
        setPeople((prev) => prev.map((c) => (c.id === p.id ? { ...c, connection_id: connId, status: "pending", outgoing: true } : c)));
      }
    });

  const onAccept = (p: Connection) =>
    withBusy(p.id, async () => {
      if (p.connection_id) await acceptConnection(p.connection_id);
      setPeople((prev) => prev.filter((c) => c.id !== p.id));
      loadBadges();
    });

  const onDecline = (p: Connection) =>
    withBusy(p.id, async () => {
      if (p.connection_id) await declineConnection(p.connection_id);
      setPeople((prev) => prev.filter((c) => c.id !== p.id));
      loadBadges();
    });

  const q = query.trim().toLowerCase();
  const filtered = q ? people.filter((p) => `${p.name} ${p.role}`.toLowerCase().includes(q)) : people;

  function RowAction({ p }: { p: Connection }) {
    if (busy.has(p.id)) {
      return (
        <div className="w-10 h-10 flex items-center justify-center text-gold">
          <Loader2 size={18} className="animate-spin" />
        </div>
      );
    }

    if (seg === "requests") {
      return (
        <div className="flex gap-2 shrink-0">
          <button onClick={() => onDecline(p)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-surface2 border border-line text-mut hover:text-ink">
            <X size={18} />
          </button>
          <button onClick={() => onAccept(p)} className="w-10 h-10 rounded-xl flex items-center justify-center text-gold" style={{ backgroundColor: "rgba(216,180,90,0.1)", border: "1px solid rgba(216,180,90,0.25)" }}>
            <Check size={18} />
          </button>
        </div>
      );
    }

    if (seg === "discover") {
      const alreadyRequested = requested.has(p.id) || (p.status === "pending" && p.outgoing);
      if (alreadyRequested) {
        return (
          <div className="flex items-center gap-[6px] rounded-xl px-3 h-10 shrink-0 bg-surface2 border border-line text-dim">
            <Clock size={14} />
            <span className="font-mono text-[10px] tracking-wide uppercase">Requested</span>
          </div>
        );
      }
      return (
        <button onClick={() => onAdd(p)} className="flex items-center gap-[6px] rounded-xl px-3 h-10 shrink-0 font-mono text-[10px] tracking-wide font-bold uppercase" style={{ backgroundColor: "#d8b45a", color: "#3a2d08" }}>
          <UserPlus size={15} />
          Add
        </button>
      );
    }

    // network → message
    return (
      <button onClick={() => setChatPeer(p)} className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-gold" style={{ backgroundColor: "rgba(216,180,90,0.1)", border: "1px solid rgba(216,180,90,0.25)" }}>
        <MessageSquare size={18} />
      </button>
    );
  }

  return (
    <div className="max-w-[760px] mx-auto">
      <header>
        <h1 className="font-serif text-[32px] font-bold text-ink">Connections</h1>
        <p className="text-dim text-[13.5px] mt-2">
          {networkCount} {networkCount === 1 ? "connection" : "connections"} · {requestCount} pending {requestCount === 1 ? "request" : "requests"}
        </p>
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
          const badge = s.key === "requests" && requestCount > 0 ? String(requestCount) : undefined;
          return (
            <button
              key={s.key}
              onClick={() => {
                if (s.key !== seg) setLoading(true);
                setSeg(s.key);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-[9px] rounded-lg font-mono text-[11px] tracking-wide uppercase transition-colors ${on ? "font-bold" : "text-dim"}`}
              style={on ? { backgroundColor: "#d8b45a", color: "#3a2d08" } : undefined}
            >
              {s.label}
              {badge && <span className="rounded-full px-[6px] text-[9px]" style={{ backgroundColor: on ? "#3a2d08" : "#d8b45a", color: on ? "#e8c873" : "#3a2d08" }}>{badge}</span>}
            </button>
          );
        })}
      </div>

      {/* people */}
      <div className="flex flex-col gap-3 mt-4">
        {loading ? (
          <div className="bg-surface border border-line rounded-2xl py-10 flex items-center justify-center text-gold">
            <Loader2 size={20} className="animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-surface border border-line rounded-2xl py-10 text-center text-dim text-[14px]">
            {seg === "requests"
              ? "No pending requests."
              : seg === "discover"
              ? "No one new to discover right now."
              : "No connections yet. Add people from Discover."}
          </div>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="flex items-center gap-4 bg-surface border border-line rounded-2xl p-4">
              <div className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-[15px] shrink-0" style={{ backgroundColor: p.color }}>
                {p.initials}
                {p.online && <span className="absolute -bottom-[2px] -right-[2px] w-3 h-3 rounded-full bg-ok border-2 border-surface" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[15.5px] text-ink truncate">{p.name}</div>
                <div className="text-dim text-[12.5px] mt-[3px] truncate">{p.role}</div>
                {!!p.mutual && <div className="text-gold font-mono text-[10.5px] mt-[6px]">{p.mutual}</div>}
              </div>
              <RowAction p={p} />
            </div>
          ))
        )}
      </div>

      {chatPeer && <ChatDialog peer={chatPeer} onClose={() => setChatPeer(null)} />}
    </div>
  );
}
