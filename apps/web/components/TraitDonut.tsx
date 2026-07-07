"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { traitStats } from "@/lib/mock";

export default function TraitDonut() {
    return (
        <ResponsiveContainer width="100%" height={230}>
            <PieChart>
                <Pie 
                    data={traitStats} 
                    dataKey="pct" 
                    nameKey="trait" 
                    innerRadius={70} 
                    outerRadius={90} 
                    paddingAngle={2}
                    stroke="none"
                >
                    {traitStats.map((t) => (
                        <Cell key={t.trait} fill={t.color} />
                    ))}
                </Pie>  
            </PieChart>
        </ResponsiveContainer>
    );
}