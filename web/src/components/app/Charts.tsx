"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type TrendRow = { date: string; total: number; critical: number; resolved: number };

export function IncidentTrend({ data }: { data: TrendRow[] }) {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3D8BFF" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#3D8BFF" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,170,214,0.08)" vertical={false} />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
          <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: "rgba(148,170,214,0.25)" }}
            contentStyle={{ background: "#0B1220", border: "1px solid rgba(148,170,214,0.2)", borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: "#cbd5e1" }}
          />
          <Area type="monotone" dataKey="total" name="Created" stroke="#3D8BFF" strokeWidth={2} fill="url(#gTotal)" />
          <Area type="monotone" dataKey="resolved" name="Resolved" stroke="#2FD39A" strokeWidth={1.5} fill="none" />
          <Area type="monotone" dataKey="critical" name="Critical" stroke="#FF5470" strokeWidth={1.5} fill="none" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
