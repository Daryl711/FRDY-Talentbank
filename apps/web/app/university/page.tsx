import { PageHeader, Panel, StatTile } from "@/components/ui";
import { EmployabilityTrendLine } from "@/components/university/UniCharts";
import { uniName, uniStats, employabilityTrend, industryLanding, courseOverview } from "@/lib/university";

export default function UniversityDashboard() {
  return (
    <>
      <PageHeader title="Dashboard" subtitle={`${uniName} · Graduate outcomes overview · Class of 2026`} />

      {/* stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {uniStats.map((s) => (
          <StatTile key={s.label} label={s.label} value={s.value} delta={s.delta} deltaTone={s.deltaTone} icon={s.icon} />
        ))}
      </div>

      {/* trend + industry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <Panel className="lg:col-span-2 p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Employability Rate Trend</h2>
          <p className="text-mut text-[12px] mt-1">6-year trajectory · all courses combined</p>
          <div className="mt-4"><EmployabilityTrendLine data={employabilityTrend} /></div>
        </Panel>

        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Industry Landing</h2>
          <div className="mt-5 flex flex-col gap-[18px]">
            {industryLanding.map((i) => (
              <div key={i.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-ink text-[13px]">{i.name}</span>
                  <span className="text-[13px] font-semibold" style={{ color: i.color }}>{i.pct}%</span>
                </div>
                <div className="h-[5px] rounded-full bg-surface3 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${i.pct * 2.2}%`, backgroundColor: i.color }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      {/* course overview table */}
      <Panel className="p-6 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-[22px] font-bold text-ink">Course Employability Overview</h2>
          <a className="text-info text-[13px] hover:opacity-80 cursor-pointer">Full report →</a>
        </div>
        <table className="w-full mt-5 border-collapse">
          <thead>
            <tr className="eyebrow text-left">
              <th className="font-normal pb-3">Course</th>
              <th className="font-normal pb-3">Graduates</th>
              <th className="font-normal pb-3">Employed</th>
              <th className="font-normal pb-3">Avg. Starting Salary</th>
              <th className="font-normal pb-3">YoY Trend</th>
            </tr>
          </thead>
          <tbody>
            {courseOverview.map((c) => (
              <tr key={c.course} className="border-t border-line/70">
                <td className="py-4 text-ink text-[14px] font-medium">{c.course}</td>
                <td className="py-4 text-dim text-[14px]">{c.graduates}</td>
                <td className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-[5px] w-[70px] rounded-full bg-surface3 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${c.employed}%`, backgroundColor: c.employed >= 90 ? "#3fbf6a" : "#5b8fd6" }} />
                    </div>
                    <span className={`text-[13px] font-semibold ${c.employed >= 90 ? "text-ok" : "text-info"}`}>{c.employed}%</span>
                  </div>
                </td>
                <td className="py-4 text-gold text-[14px] font-semibold">{c.salary}</td>
                <td className={`py-4 text-[13px] font-semibold ${c.yoy >= 0 ? "text-ok" : "text-danger"}`}>{c.yoy >= 0 ? "+" : ""}{c.yoy}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </>
  );
}
