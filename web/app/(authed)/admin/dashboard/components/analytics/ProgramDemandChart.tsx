"use client";

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
import { truncateLabel } from "../../utils/format";
import { AnalyticsCard, AXIS_TICK, EmptyChart, GRID_STROKE } from "./AnalyticsCard";

const config: ChartConfig = {
  problems: { label: "Problems requesting", color: "var(--accent)" },
  solvers: { label: "Solvers enrolled", color: "var(--primary-foreground)" },
};

export function ProgramDemandChart({ data }: { data: AdminAnalytics["programDemand"] }) {
  return (
    <AnalyticsCard
      title="Program Demand vs. Talent"
      subtitle="Problems' preferred program compared with solvers' degree programs"
    >
      {data.length === 0 ? (
        <EmptyChart message="No program data yet" />
      ) : (
        <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(256, data.length * 44 + 40) }}>
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }} barGap={2}>
            <CartesianGrid horizontal={false} stroke={GRID_STROKE} strokeDasharray="4 4" />
            <XAxis type="number" tickLine={false} axisLine={false} tick={AXIS_TICK} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="program"
              tickLine={false}
              axisLine={false}
              tick={AXIS_TICK}
              width={150}
              tickFormatter={(value: string) => truncateLabel(value)}
            />
            <ChartTooltip cursor={{ fill: "rgba(92,168,124,0.06)" }} content={<ChartTooltipContent indicator="dot" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="problems" fill="var(--color-problems)" radius={[0, 4, 4, 0]} maxBarSize={14} />
            <Bar dataKey="solvers" fill="var(--color-solvers)" radius={[0, 4, 4, 0]} maxBarSize={14} />
          </BarChart>
        </ChartContainer>
      )}
    </AnalyticsCard>
  );
}
