"use client";

import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AdminAnalytics } from "@/types/admin";
import { humanizeEnum } from "../../utils/format";
import { AnalyticsBadge, AnalyticsCard, AXIS_TICK, EmptyChart, GRID_STROKE } from "./AnalyticsCard";

// Brand greens for healthy states; badge-matching amber/rose/slate for the rest
const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "var(--accent)",
  PENDING_REVIEW: "#f59e0b",
  COMPLETED: "var(--secondary)",
  REJECTED: "#e11d48",
  ABANDONED: "#94a3b8",
  TERMINATED: "#64748b",
};

const ORDER = ["ACTIVE", "PENDING_REVIEW", "COMPLETED", "REJECTED", "ABANDONED", "TERMINATED"];

const config: ChartConfig = { count: { label: "Attempts" } };

export function AttemptOutcomesChart({ data }: { data: AdminAnalytics["attemptOutcomes"] }) {
  const chartData = useMemo(
    () =>
      [...data]
        .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status))
        .map((d) => ({ ...d, label: humanizeEnum(d.status), fill: STATUS_COLORS[d.status] ?? "#94a3b8" })),
    [data]
  );

  const total = data.reduce((sum, d) => sum + d.count, 0);
  const completed = data.find((d) => d.status === "COMPLETED")?.count ?? 0;
  const rejected = data.find((d) => d.status === "REJECTED")?.count ?? 0;
  const reviewed = completed + rejected;
  const approvalRate = reviewed > 0 ? Math.round((completed / reviewed) * 100) : null;

  return (
    <AnalyticsCard
      title="Solution Attempt Outcomes"
      subtitle="Where every claimed attempt ended up"
      badge={approvalRate !== null && <AnalyticsBadge>{approvalRate}% approved</AnalyticsBadge>}
    >
      {total === 0 ? (
        <EmptyChart message="No solution attempts yet" />
      ) : (
        <ChartContainer config={config} className="aspect-auto h-64 w-full">
          <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="4 4" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} width={112} />
            <ChartTooltip cursor={{ fill: "rgba(92,168,124,0.06)" }} content={<ChartTooltipContent hideIndicator />} />
            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={22}>
              {chartData.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      )}
    </AnalyticsCard>
  );
}
