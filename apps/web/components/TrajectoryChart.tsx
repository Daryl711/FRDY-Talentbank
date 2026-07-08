"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { TrajPoint } from "@/lib/types";

export default function TrajectoryChart({ data }: { data: TrajPoint[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data} margin={{ top: 10, right:12, left: -20, bottom: 0 }}>
                <XAxis dataKey="label" stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#6a7388" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} domain={[70, 100]} ticks={[70, 78, 86, 100]} />
                <Tooltip
                    contentStyle={{ background: "#121a2e", border: "1px solid #222e48", borderRadius: 12, fontSize: 12 }}
                    labelStyle={{ color: "#f3f0e7" }}
                    itemStyle={{ color: "#d8b45a" }}
                />
                <Line type="monotone" dataKey="value" stroke="#d8b45a" strokeWidth={2.5} dot={{ r: 4, fill: "#d8b45a" }} name="Readiness" />
            </LineChart>
        </ResponsiveContainer>
    );
}