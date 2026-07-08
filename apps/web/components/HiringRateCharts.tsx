"use client";

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { hiringRateByDept, hiringRateTrend } from "@/lib/mock";

const tooltip = {
  contentStyle: { background: "#121a2e", border: "1px solid #222e48", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "#f3f0e7" },
  itemStyle: { color: "#d8b45a" },
};

export function RateTrend() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={hiringRateTrend} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1b2742" vertical={false} />
        <XAxis dataKey="month" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 10]} />
        <Tooltip {...tooltip} />
        <Line type="monotone" dataKey="rate" stroke="#d8b45a" strokeWidth={2.5} dot={{ r: 4, fill: "#d8b45a" }} name="Hiring rate %" />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function RateByDept() {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={hiringRateByDept} margin={{ top: 10, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid stroke="#1b2742" vertical={false} />
        <XAxis dataKey="dept" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 10]} />
        <Tooltip {...tooltip} cursor={{ fill: "#16203a" }} />
        <Bar dataKey="rate" radius={[6, 6, 0, 0]} name="Hiring rate %">
          {hiringRateByDept.map((d) => (
            <Cell key={d.dept} fill="#d8b45a" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
