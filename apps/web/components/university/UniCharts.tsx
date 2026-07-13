"use client";

import {
  Area, AreaChart, Bar, BarChart, Cell, LabelList, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { interestScore, searchVolume } from "@/lib/university";

const tip = {
  contentStyle: { background: "#121a2e", border: "1px solid #222e48", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "#f3f0e7" },
  itemStyle: { color: "#5b8fd6" },
};

export function EmployabilityTrendLine({ data }: { data: { year: string; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
        <XAxis dataKey="year" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[60, 100]} ticks={[60, 70, 80, 90, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...tip} />
        <Line type="monotone" dataKey="rate" stroke="#5b8fd6" strokeWidth={2.5} dot={false} name="Employability" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CourseTrendLine({ data }: { data: { year: string; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <LineChart data={data} margin={{ top: 10, right: 12, left: -14, bottom: 0 }}>
        <XAxis dataKey="year" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[55, 100]} ticks={[55, 70, 85, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...tip} />
        <Line type="monotone" dataKey="rate" stroke="#5b8fd6" strokeWidth={2.5} dot={{ r: 4, fill: "#5b8fd6" }} name="Employability" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RateByCourseBars({ data }: { data: { course: string; rate: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} layout="vertical" margin={{ top: 6, right: 30, left: 40, bottom: 0 }}>
        <XAxis type="number" domain={[50, 100]} stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
        <YAxis type="category" dataKey="course" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={130} />
        <Tooltip {...tip} cursor={{ fill: "#16203a" }} />
        <Bar dataKey="rate" radius={[0, 5, 5, 0]} fill="#5b8fd6" barSize={12}>
          <LabelList dataKey="rate" position="right" formatter={(v: number) => `${v}%`} style={{ fill: "#97a0b5", fontSize: 11 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function EmployabilityGauge({ pct }: { pct: number }) {
  const data = [
    { name: "employed", value: pct },
    { name: "rest", value: 100 - pct },
  ];
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie data={data} dataKey="value" innerRadius={64} outerRadius={84} startAngle={90} endAngle={-270} stroke="none">
          <Cell fill="#5b8fd6" />
          <Cell fill="#1b2742" />
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SearchVolumeArea() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={searchVolume} margin={{ top: 10, right: 12, left: -6, bottom: 0 }}>
        <defs>
          <linearGradient id="techFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5b8fd6" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#5b8fd6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="week" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 3200]} ticks={[0, 800, 1600, 2400, 3200]} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey="tech" stroke="#5b8fd6" strokeWidth={2.5} fill="url(#techFill)" name="Tech" />
        <Area type="monotone" dataKey="finance" stroke="#d8b45a" strokeWidth={2} fill="transparent" name="Finance" />
        <Area type="monotone" dataKey="consulting" stroke="#a78bfa" strokeWidth={2} fill="transparent" name="Consulting" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function InterestScoreBars() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={interestScore} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <XAxis dataKey="course" stroke="#6a7388" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={0} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={(v) => `${v}%`} />
        <Tooltip {...tip} cursor={{ fill: "#16203a" }} />
        <Bar dataKey="score" radius={[5, 5, 0, 0]} fill="#5b8fd6" barSize={26}>
          {interestScore.map((d) => (
            <Cell key={d.course} fill="#5b8fd6" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
