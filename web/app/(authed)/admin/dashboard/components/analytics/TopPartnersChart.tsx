"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { AdminAnalytics } from "@/types/admin";
import { truncateLabel } from "../../utils/format";
import { AnalyticsCard, AXIS_TICK, EmptyChart, GRID_STROKE } from "./AnalyticsCard";

const config: ChartConfig = {
  problems: { label: "Problems posted", color: "var(--secondary)" },
};

export function TopPartnersChart({ data }: { data: AdminAnalytics["topPartners"] }) {
  return (
    <AnalyticsCard title="Most Active Industry Partners" subtitle="Ranked by problems posted • All time">
      {data.length === 0 ? (
        <EmptyChart message="No problems posted yet" />
      ) : (
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(256, data.length * 40 + 24) }}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="4 4" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="organizationName"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={150}
              tickFormatter={(value: string) => truncateLabel(value)}
            />
            <ChartTooltip cursor={{ fill: "rgba(92,168,124,0.06)" }} content={<ChartTooltipContent indicator="dot" />} />
            <Bar dataKey="problems" fill="var(--color-problems)" radius={[0, 4, 4, 0]} maxBarSize={22} />
          </BarChart>
        </ChartContainer>
      )}
    </AnalyticsCard>
  );
}
