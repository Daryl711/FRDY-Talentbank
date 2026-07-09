"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { trend } from "@/lib/mock";

export default function ApplicationsChart() {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={trend} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d8b45a" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#d8b45a" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3fbf6a" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#3fbf6a" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#1b2742" vertical={false} />
        <XAxis dataKey="month" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 600]} ticks={[0, 150, 300, 450, 600]} />
        <Tooltip
          contentStyle={{ background: "#121a2e", border: "1px solid #222e48", borderRadius: 12, fontSize: 12 }}
          labelStyle={{ color: "#f3f0e7" }}
          itemStyle={{ color: "#97a0b5" }}
        />
        <Area type="monotone" dataKey="applications" stroke="#d8b45a" strokeWidth={2.5} fill="url(#goldFill)" name="Applications" />
        <Area type="monotone" dataKey="hired" stroke="#3fbf6a" strokeWidth={2.5} fill="url(#greenFill)" name="Hired" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
