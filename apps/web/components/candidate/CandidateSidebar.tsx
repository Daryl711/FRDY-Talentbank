"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Briefcase, Send, FileText, Users, Sparkles, User, ChevronRight, LogOut, Menu, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getMyProfile } from "@/lib/candidate";
import Avatar from "@/components/candidate/Avatar";
import NotificationBell from "@/components/candidate/NotificationBell";

const NAV = [
  { href: "/candidate", label: "Home", icon: Home },
  { href: "/candidate/match", label: "Job Match", icon: Briefcase },
  { href: "/candidate/applications", label: "Applications", icon: Send },
  { href: "/candidate/resume", label: "Resume", icon: FileText },
  { href: "/candidate/connect", label: "Connect", icon: Users },
  { href: "/candidate/advisor", label: "Advisor", icon: Sparkles, badge: "AI" },
  { href: "/candidate/profile", label: "Profile", icon: User },
];

export default function CandidateSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
  }

  const [profile, setProfile] = useState<{ name: string; initials: string; headline: string } | null>(null);
  useEffect(() => {
    getMyProfile().then((p) => setProfile({ name: p.name, initials: p.initials, headline: p.headline }));
  }, []);

  const displayName = profile?.name ?? user?.email ?? "Candidate";
  const displayRole = profile?.headline ?? "Job Seeker";

  async function handleSignOut() {
    await signOut();
    router.push("/");
  }

  return (
    <>
      {/* mobile top bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-3 bg-bgtop border-b border-line px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-goldbright to-golddeep flex items-center justify-center shrink-0">
            <Sparkles size={16} style={{ color: "#2b2106" }} />
          </div>
          <span className="font-serif text-[17px] font-bold text-ink leading-none truncate">Mango</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <NotificationBell />
          <button onClick={() => setOpen(true)} className="text-dim hover:text-ink p-1" aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>
      </div>

      {/* backdrop */}
      {open && <div className="fixed inset-0 z-40 bg-black/60 lg:hidden" onClick={() => setOpen(false)} />}

      <aside
        className={`w-[230px] shrink-0 bg-bgtop border-r border-line flex flex-col min-h-screen fixed inset-y-0 left-0 z-50 overflow-y-auto transform transition-transform duration-200 lg:sticky lg:top-0 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
      {/* brand */}
      <div className="px-5 py-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-goldbright to-golddeep flex items-center justify-center shrink-0">
            <Sparkles size={18} style={{ color: "#2b2106" }} />
          </div>
          <div className="min-w-0">
            <div className="font-serif text-[19px] font-bold text-ink leading-none">Mango</div>
            <div className="eyebrow mt-1 !text-gold">Candidate</div>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <div className="hidden lg:block"><NotificationBell /></div>
          <button onClick={() => setOpen(false)} className="lg:hidden text-mut hover:text-ink p-1" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* identity card */}
      <div className="mx-3 mb-3 bg-surface2 border border-line rounded-xl px-3 py-3 flex items-center gap-3">
        <Avatar size={32} />
        <div className="min-w-0">
          <div className="text-ink text-[13px] font-semibold truncate">{displayName}</div>
          <div className="eyebrow mt-[2px]">Candidate</div>
        </div>
      </div>

      {/* nav */}
      <nav className="px-3 flex flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const on = item.href === "/candidate" ? pathname === "/candidate" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-[11px] rounded-xl text-[14px] transition-colors ${
                on ? "bg-gold/[0.13] text-ink border border-gold/25" : "text-dim hover:text-ink hover:bg-surface/60 border border-transparent"
              }`}
            >
              <Icon size={18} className={on ? "text-gold" : "text-mut"} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge && (
                <span className="font-mono text-[8.5px] tracking-wide px-[6px] py-[2px] rounded bg-surface3 text-gold border border-line2">
                  {item.badge}
                </span>
              )}
              {on && <ChevronRight size={15} className="text-gold" />}
            </Link>
          );
        })}
      </nav>

      {/* footer user */}
      <div className="mt-auto border-t border-line">
        <div className="px-4 py-4 flex items-center gap-3">
          <Avatar size={36} />
          <div className="min-w-0">
            <div className="text-ink text-[13px] font-semibold leading-none truncate">{displayName}</div>
            <div className="eyebrow mt-[3px] truncate">{displayRole}</div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-4 py-3 text-danger text-[13px] hover:bg-danger/10 transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
      </aside>
    </>
  );
}
