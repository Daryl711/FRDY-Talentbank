"use client";

import { FileDown } from "lucide-react";
import { PageHeader, Panel, StatTile } from "@/components/ui";
import { RateByDept, RateTrend } from "@/components/employer/HiringRateCharts";
import { hiringRateByDept, hiringRateTrend } from "@/lib/mock";
import { generateHiringRateReport } from "@/lib/employerReport";

const OVERALL_RATE = "7.4%";
const BEST_DEPARTMENT = "Finance";
const AVG_TIME_TO_HIRE = "18d";

export default function HiringRatePage() {
  return (
    <>
      <PageHeader
        title="Hiring Rate"
        subtitle="Conversion from application to hire across roles and departments"
        action={
          <button
            onClick={() => generateHiringRateReport(OVERALL_RATE, BEST_DEPARTMENT, AVG_TIME_TO_HIRE, hiringRateTrend, hiringRateByDept)}
            title="Download a hiring rate report (.xlsx)"
            className="flex items-center gap-2 bg-surface2 border border-line rounded-xl px-4 py-[10px] text-dim text-[13px] font-semibold hover:text-ink"
          >
            <FileDown size={15} /> Generate Report
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatTile label="Overall Hiring Rate" value={OVERALL_RATE} delta="+1.2% vs last month" deltaTone="up" icon="trending" />
        <StatTile label="Best Department" value={BEST_DEPARTMENT} delta="9.4% conversion" deltaTone="up" icon="briefcase" />
        <StatTile label="Avg. Time to Hire" value={AVG_TIME_TO_HIRE} delta="-3d vs last quarter" deltaTone="down" icon="clock" />
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
