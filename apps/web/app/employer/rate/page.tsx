import { PageHeader, Panel, StatTile } from "@/components/ui";
import { RateByDept, RateTrend } from "@/components/employer/HiringRateCharts";

export default function HiringRatePage() {
  return (
    <>
      <PageHeader title="Hiring Rate" subtitle="Conversion from application to hire across roles and departments" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatTile label="Overall Hiring Rate" value="7.4%" delta="+1.2% vs last month" deltaTone="up" icon="trending" />
        <StatTile label="Best Department" value="Finance" delta="9.4% conversion" deltaTone="up" icon="briefcase" />
        <StatTile label="Avg. Time to Hire" value="18d" delta="-3d vs last quarter" deltaTone="down" icon="clock" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">Hiring Rate Trend</h2>
          <p className="text-mut text-[12px] mt-1">6-month rolling view</p>
          <div className="mt-4"><RateTrend /></div>
        </Panel>
        <Panel className="p-6">
          <h2 className="font-serif text-[22px] font-bold text-ink">By Department</h2>
          <p className="text-mut text-[12px] mt-1">Current period</p>
          <div className="mt-4"><RateByDept /></div>
        </Panel>
      </div>
    </>
  );
}
