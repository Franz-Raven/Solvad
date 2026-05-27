"use client";

import { useMemo } from "react";
import { BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { SdgDistributionDto } from "@/types/dashboard.types";

interface BarChartProps {
  sdgData: SdgDistributionDto[] | null;
  title?: string;
}

// Hardcoded SDG mapping
const SDG_MAP: Record<number, string> = {
  1: "No Poverty",
  2: "Zero Hunger",
  3: "Good Health and Well-being",
  4: "Quality Education",
  5: "Gender Equality",
  6: "Clean Water and Sanitation",
  7: "Affordable and Clean Energy",
  8: "Decent Work and Economic Growth",
  9: "Industry, Innovation and Infrastructure",
  10: "Reduced Inequalities",
  11: "Sustainable Cities and Communities",
  12: "Responsible Consumption and Production",
  13: "Climate Action",
  14: "Life Below Water",
  15: "Life on Land",
  16: "Peace, Justice and Strong Institutions",
  17: "Partnerships for the Goals",
};

// Green theme colors
const GREEN_PALETTE = [
  "#5CA87C",
  "#4A9B6E",
  "#3D8F62",
  "#2E8054",
  "#288760",
  "#1A6E48",
  "#0F5A3A",
];

function normalizeAndMerge(data: SdgDistributionDto[]) {
  const map = new Map<number, { short: string; full: string; count: number }>();
  for (const item of data) {
    let sdgNumber: number | null = null;
    let fullName = item.sdgFocus;

    // extract number from string like "9. Industry..."
    const match = item.sdgFocus.match(/^(\d+)\./);
    if (match) {
      sdgNumber = parseInt(match[1], 10);
      fullName = item.sdgFocus.replace(/^\d+\.\s*/, "");
    } else {
      // Fallback: search by description
      const entry = Object.entries(SDG_MAP).find(([_, desc]) => desc === item.sdgFocus);
      if (entry) {
        sdgNumber = parseInt(entry[0], 10);
        fullName = entry[1];
      }
    }

    if (sdgNumber && SDG_MAP[sdgNumber]) {
      const short = `SDG ${sdgNumber}`;
      if (map.has(sdgNumber)) {
        map.get(sdgNumber)!.count += item.problemCount;
      } else {
        map.set(sdgNumber, { short, full: fullName, count: item.problemCount });
      }
    } else {
      // Unknown
      const otherKey = 0;
      if (map.has(otherKey)) {
        map.get(otherKey)!.count += item.problemCount;
      } else {
        map.set(otherKey, { short: "Other", full: "Other SDG", count: item.problemCount });
      }
    }
  }

  // Convert to array and sort by SDG number (ascending)
  return Array.from(map.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, data], idx) => ({
      sdgShort: data.short,
      sdgFull: data.full,
      problemCount: data.count,
      barColor: GREEN_PALETTE[idx % GREEN_PALETTE.length],
    }));
}

export function BarChart({ sdgData, title }: BarChartProps) {
  const chartData = useMemo(() => {
    if (!sdgData || sdgData.length === 0) return [];
    return normalizeAndMerge(sdgData);
  }, [sdgData]);

  if (chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center h-80">
        <p className="text-gray-400 text-sm">No SDG data available</p>
      </div>
    );
  }

  // Dummy config to satisfy ChartContainer
  const dummyConfig: ChartConfig = {};

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {title && <h3 className="font-semibold text-gray-900 mb-4 text-center">{title}</h3>}
      <div className="h-80 w-full">
        <ChartContainer config={dummyConfig} className="h-full w-full">
          <ReBarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 30 }}>
            <CartesianGrid vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey="sdgShort"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              interval={0}
              height={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#6b7280" }}
              allowDecimals={false}
              width={30}
            />
            <ChartTooltip
              cursor={{ fill: "rgba(92,168,124,0.1)" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const entry = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-2 shadow-sm">
                      <p className="text-xs font-medium">{entry.sdgFull}</p>
                      <p className="text-xs text-muted-foreground">{entry.problemCount} problems</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="problemCount" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.barColor} />
              ))}
            </Bar>
          </ReBarChart>
        </ChartContainer>
      </div>
    </div>
  );
}