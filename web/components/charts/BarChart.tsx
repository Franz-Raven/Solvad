"use client";

import { useMemo } from "react";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SdgDistributionDto } from "@/types/dashboard.types";

interface BarChartProps {
  sdgData: SdgDistributionDto[] | null;
  title?: string;
}

const chartConfig: ChartConfig = {
  count: { label: "Problems", color: "#14AC41" }, // green accent
};

function normalizeAndMerge(data: SdgDistributionDto[]) {
  const merged: Record<string, number> = {};
  for (const item of data) {
    const cleanName = item.sdgFocus.replace(/^\d+\.\s*/, "");
    merged[cleanName] = (merged[cleanName] || 0) + item.problemCount;
  }
  return Object.entries(merged).map(([sdgFocus, problemCount]) => ({
    sdgFocus,
    problemCount,
  }));
}

export function BarChart({ sdgData, title }: BarChartProps) {
  const chartData = useMemo(() => {
    if (!sdgData || sdgData.length === 0) return [];
    return normalizeAndMerge(sdgData);
  }, [sdgData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-80">
        <p className="text-gray-400 text-sm">No SDG data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-center font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="h-80 w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ReBarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="sdgFocus"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              angle={-45}
              textAnchor="end"
              height={60}
              interval={0}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              allowDecimals={false}
              width={30}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(20,172,65,0.05)" }}
              content={<ChartTooltipContent indicator="dot" />}
            />
            <Bar dataKey="problemCount" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
          </ReBarChart>
        </ChartContainer>
      </div>
    </div>
  );
}