"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, PawPrint, TrendingUp, Briefcase, BarChart3, Sparkles, ChevronRight, LogOut } from "lucide-react";
import { orgName, orgInitials, hiringUser } from "@/lib/mock";

const NAV = [
    { href: "/employer", label: "Dashboard", icon: LayoutGrid },
    { href: "/employer/traits", label: "Animal Traits", icon: PawPrint },
    { href: "/employer/trajectory", label: "Trajectory", icon: TrendingUp, badge: "ML" },
    { href: "/employer/hiring", label: "Hiring", icon: Briefcase },
    { href: "/employer/rate", label: "Hiring Rate", icon: BarChart3 },
];

export default function EmployerSidebar() {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <aside className="w-[230px] shrink-0 bg-bgtop border-r border-line flex flex-col min-h-screen sticky top-0">
        {/* brand */}
        <div className="px-5 py-5 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-goldbright to-golddeep flex items-center justify-center">
            <Sparkles size={18} style={{ color: "#2b2106" }} />
            </div>
            <div>
            <div className="font-serif text-[19px] font-bold text-ink leading-none">Mango</div>
            <div className="eyebrow mt-1 !text-gold">Employer</div>
            </div>
        </div>

        {/* org switcher */}
        <div className="mx-3 mb-3 bg-surface2 border border-line rounded-xl px-3 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-info/20 text-info flex items-center justify-center text-[12px] font-bold">
            {orgInitials}
            </div>
            <div className="min-w-0">
            <div className="text-ink text-[13px] font-semibold truncate">{orgName}</div>
            <div className="eyebrow mt-[2px]">Employer</div>
            </div>
        </div>

        {/* nav */}
        <nav className="px-3 flex flex-col gap-1">
            {NAV.map((item) => {
            const Icon = item.icon;
            const on = item.href === "/employer" ? pathname === "/employer" : pathname.startsWith(item.href);
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-goldbright to-golddeep flex items-center justify-center text-[12px] font-bold" style={{ color: "#2b2106" }}>
                {hiringUser.initials}
            </div>
            <div>
                <div className="text-ink text-[13px] font-semibold leading-none">{hiringUser.name}</div>
                <div className="eyebrow mt-[3px]">{hiringUser.role}</div>
            </div>
            </div>
            <button
            onClick={() => router.push("/")}
            className="w-full flex items-center gap-3 px-4 py-3 text-danger text-[13px] hover:bg-danger/10 transition-colors"
            >
            <LogOut size={16} />
            Sign Out
            </button>
        </div>
    </aside>
  );
}