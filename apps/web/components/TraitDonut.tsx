"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { traitStats as mockTraitStats } from "@/lib/mock";
import type { TraitStat } from "@/lib/types";

/** Defaults to the demo mock breakdown; the live Animal Traits page passes real trait counts instead. */
export default function TraitDonut({ data = mockTraitStats }: { data?: TraitStat[] }) {
    return (
        <ResponsiveContainer width="100%" height={230}>
            <PieChart>
                <Pie
                    data={data}
                    dataKey="pct"
                    nameKey="trait"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={2}
                    stroke="none"
                >
                    {data.map((t) => (
                        <Cell key={t.trait} fill={t.color} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
}