import { PageHeader, Panel, StatTile } from "@/components/ui";
import ApplicationsChart from "@/components/ApplicantsChart";
import RecentApplicants from "@/components/RecentApplicants";
import { periodLabel, stats, pipeline } from "@/lib/mock";

export default function DashboardPage() {
  const peak = Math.max(...pipeline.map((s) => s.count));

  return (
    <>
      <PageHeader title="Dashboard" subtitle={periodLabel} />

      {/* headline stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <StatTile
            key={s.label}
            label={s.label}
            value={s.value}
            delta={s.delta}
            deltaTone={s.deltaTone}
            icon={s.icon}
          />
        ))}
      </div>

      {/* applications trend + pipeline funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Panel className="p-6 lg:col-span-2">
          <h2 className="font-serif text-[22px] font-bold text-ink">Applications vs. Hires</h2>
          <p className="text-mut text-[12px] mt-1">6-month rolling view</p>
          <div className="mt-4"><ApplicationsChart /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Pipeline</h2>
          <p className="text-mut text-[12px] mt-1">Candidates by stage</p>
          <div className="mt-5 flex flex-col gap-4">
            {pipeline.map((s) => (
              <div key={s.stage}>
                <div className="flex items-center justify-between mb-[6px]">
                  <span className="text-dim text-[13px]">{s.stage}</span>
                  <span className="text-ink text-[13px] font-semibold">{s.count.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-goldbright to-golddeep"
                    style={{ width: `${Math.max((s.count / peak) * 100, 3)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* recent applicants table */}
      <RecentApplicants />
    </>
  );
}
