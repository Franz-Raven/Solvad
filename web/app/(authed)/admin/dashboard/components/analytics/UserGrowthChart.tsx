"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { AdminAnalytics } from "@/types/admin";
import { formatMonth } from "../../utils/format";
import { AnalyticsBadge, AnalyticsCard, AXIS_TICK, EmptyChart, GRID_STROKE } from "./AnalyticsCard";

const config: ChartConfig = {
  solvers: { label: "Solvers", color: "var(--accent)" },
  seekers: { label: "Industry Partners", color: "var(--primary-foreground)" },
};

export function UserGrowthChart({ data }: { data: AdminAnalytics["userGrowth"] }) {
  const chartData = useMemo(() => data.map((d) => ({ ...d, label: formatMonth(d.month) })), [data]);
  const total = data.reduce((sum, d) => sum + d.solvers + d.seekers, 0);

  return (
    <AnalyticsCard
      title="User Growth"
      subtitle="New sign-ups per month • Last 6 months"
      badge={<AnalyticsBadge>+{total.toLocaleString()} users</AnalyticsBadge>}
    >
      {total === 0 ? (
        <EmptyChart message="No sign-ups in the last 6 months" />
      ) : (
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              {(["solvers", "seekers"] as const).map((key) => (
                <linearGradient key={key} id={`grad-growth-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} dy={10} />
            <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} width={30} />
            <ChartTooltip cursor={{ strokeDasharray: "4 4" }} content={<ChartTooltipContent indicator="line" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Area type="monotone" dataKey="solvers" stackId="users" stroke="var(--color-solvers)" strokeWidth={2.5} fill="url(#grad-growth-solvers)" />
            <Area type="monotone" dataKey="seekers" stackId="users" stroke="var(--color-seekers)" strokeWidth={2.5} fill="url(#grad-growth-seekers)" />
          </AreaChart>
        </ChartContainer>
      )}
    </AnalyticsCard>
  );
}
