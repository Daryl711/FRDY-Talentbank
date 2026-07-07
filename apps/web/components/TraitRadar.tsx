"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { RadarAxis } from "@/lib/types";

export default function TraitRadar({ data }: { data: RadarAxis[] }) {
    return (
        <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={data} outerRadius={80}>
                <PolarGrid stroke="#2d3a57" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: "#97a0b5", fontSize: 11 }} />
                <Radar dataKey="value" stroke="#d8b45a" fill="#d8b45a" fillOpacity={0.6} strokeWidth={2} />
            </RadarChart>
        </ResponsiveContainer>
    );
}