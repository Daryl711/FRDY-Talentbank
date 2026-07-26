"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, UserPlus, Briefcase, TrendingUp } from "lucide-react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  type AppNotification,
} from "@/lib/candidate";

const KIND_ICON: Record<string, typeof Bell> = {
  message: MessageSquare,
  connection_request: UserPlus,
  connection_accepted: UserPlus,
  match: Briefcase,
  stage_change: TrendingUp,
};

function timeAgo(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.round(hr / 24)}d ago`;
}

/**
 * Notification bell: connection messages, connection requests/accepts, new
 * matches, and hiring-stage changes — all rows come from
 * supabase/schema.sql triggers on messages/connections/matches (see
 * lib/candidate.ts's getNotifications). Live via subscribeNotifications.
 * Reused in both the sidebar (narrow column, so the panel flies out to the
 * side) and the dashboard header (wide row, so the panel drops down
 * right-aligned instead of running off the edge of the viewport).
 */
export default function NotificationBell({
  buttonClassName = "w-9 h-9 rounded-xl",
  iconSize = 17,
  panelPlacement = "flyout",
}: {
  buttonClassName?: string;
  iconSize?: number;
  panelPlacement?: "flyout" | "dropdown";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  function refreshBadge() {
    getUnreadNotificationCount().then(setUnread);
  }

  function load() {
    setLoading(true);
    getNotifications().then((rows) => {
      setItems(rows);
      setLoading(false);
    });
  }

  useEffect(() => {
    refreshBadge();
    const unsubscribe = subscribeNotifications(() => {
      refreshBadge();
      setOpen((isOpen) => {
        if (isOpen) load();
        return isOpen;
      });
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function toggle() {
    setOpen((wasOpen) => {
      if (!wasOpen) load();
      return !wasOpen;
    });
  }

  async function onSelect(n: AppNotification) {
    if (!n.read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  async function onMarkAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
  }

  const panelPositionClass = panelPlacement === "flyout" ? "left-full top-0 ml-2" : "right-0 top-full mt-2";

  return (
    <div className="relative" ref={rootRef}>
      <button
        onClick={toggle}
        className={`relative bg-surface2 border border-line flex items-center justify-center text-dim hover:text-ink transition-colors ${buttonClassName}`}
        aria-label="Notifications"
      >
        <Bell size={iconSize} />
        {unread > 0 && (
          <span className="absolute -top-[3px] -right-[3px] min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${panelPositionClass} z-50 w-[340px] max-h-[440px] overflow-y-auto bg-bgtop border border-line rounded-2xl shadow-xl`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-line">
            <span className="font-serif text-[15px] font-bold text-ink">Notifications</span>
            {unread > 0 && (
              <button onClick={onMarkAll} className="text-gold text-[11.5px] font-medium hover:text-goldbright">
                Mark all read
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-mut text-[13px] py-8 text-center">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-mut text-[13px] py-8 text-center">No notifications yet.</div>
          ) : (
            <div className="flex flex-col">
              {items.map((n) => {
                const Icon = KIND_ICON[n.kind] ?? Bell;
                return (
                  <button
                    key={n.id}
                    onClick={() => onSelect(n)}
                    className={`flex items-start gap-3 text-left px-4 py-3 border-b border-line/60 last:border-b-0 hover:bg-surface/60 transition-colors ${
                      n.read ? "" : "bg-gold/[0.04]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-surface2 border border-line flex items-center justify-center shrink-0 text-gold">
                      <Icon size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-[13px] leading-[18px] ${n.read ? "text-dim" : "text-ink font-semibold"}`}>{n.title}</div>
                      {n.body && <div className="text-mut text-[12px] leading-[17px] mt-[3px] truncate">{n.body}</div>}
                      <div className="font-mono text-[10px] text-mut mt-[4px]">{timeAgo(n.createdAt)}</div>
                    </div>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-gold shrink-0 mt-2" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
