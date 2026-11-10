"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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
import { AnalyticsCard, AXIS_TICK, EmptyChart, GRID_STROKE } from "./AnalyticsCard";

const config: ChartConfig = {
  problemsPosted: { label: "Problems posted", color: "var(--accent)" },
  attemptsStarted: { label: "Attempts started", color: "var(--secondary)" },
  solutionsCompleted: { label: "Solutions completed", color: "var(--primary-foreground)" },
};

export function PlatformActivityChart({ data }: { data: AdminAnalytics["platformActivity"] }) {
  const chartData = useMemo(() => data.map((d) => ({ ...d, label: formatMonth(d.month) })), [data]);
  const hasData = data.some((d) => d.problemsPosted + d.attemptsStarted + d.solutionsCompleted > 0);

  return (
    <AnalyticsCard title="Platform Activity" subtitle="Posting → solving pipeline • Last 6 months">
      {!hasData ? (
        <EmptyChart message="No activity in the last 6 months" />
      ) : (
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barGap={2}>
            <CartesianGrid vertical={false} stroke={GRID_STROKE} strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} dy={10} />
            <YAxis tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} width={30} />
            <ChartTooltip cursor={{ fill: "rgba(92,168,124,0.06)" }} content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="problemsPosted" fill="var(--color-problemsPosted)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="attemptsStarted" fill="var(--color-attemptsStarted)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            <Bar dataKey="solutionsCompleted" fill="var(--color-solutionsCompleted)" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ChartContainer>
      )}
    </AnalyticsCard>
  );
}
