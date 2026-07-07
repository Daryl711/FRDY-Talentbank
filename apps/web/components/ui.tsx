import { Briefcase, Users, TrendingUp, Clock, Target, Zap, ArrowRight, LucideIcon } from "lucide-react";

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <section className={`bg-surface border border-line rounded-2xl ${className}`}>{children}</section>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: React.ReactNode }) {
  return (
    <header className="flex items-start justify-between mb-7">
      <div>
        <h1 className="font-serif text-[32px] font-bold text-ink">{title}</h1>
        <p className="text-dim text-[14px] mt-1">{subtitle}</p>
      </div>
      {action}
    </header>
  );
}

const STAT_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase, users: Users, trending: TrendingUp, clock: Clock,
  target: Target, zap: Zap, arrow: ArrowRight,
};

export function StatTile({
  label, value, delta, deltaTone = "up", icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "flat";
  icon: string;
}) {
  const Icon = STAT_ICONS[icon] ?? Briefcase;
  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between">
        <span className="eyebrow">{label}</span>
        <Icon size={18} className="text-gold" />
      </div>
      <div className="font-serif text-[30px] font-bold text-gold mt-3">{value}</div>
      {delta && <div className={`text-[12px] mt-2 ${deltaTone === "down" ? "text-ok" : "text-ok"}`}>{delta}</div>}
    </Panel>
  );
}
