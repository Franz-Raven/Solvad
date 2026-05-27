"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ProblemStatusGroupDto } from "@/types/dashboard.types";

interface DonutChartProps {
  statusData: ProblemStatusGroupDto | null;
  title?: string;
}

const COLORS = {
  open: "#4CAF50",
  active: "#FF9800",
  solvedNeedsImprovement: "#2196F3",
  completed: "#9C27B0",
  closed: "#F44336",
};

const STATUS_LABELS: Record<keyof ProblemStatusGroupDto, string> = {
  open: "Open",
  active: "Active",
  solvedNeedsImprovement: "Solved (Needs Improvement)",
  completed: "Completed",
  closed: "Closed",
};

export function DonutChart({ statusData, title }: DonutChartProps) {
  const chartData = useMemo(() => {
    if (!statusData) return [];
    return Object.entries(statusData)
      .filter(([_, value]) => value > 0)
      .map(([key, value]) => ({
        name: STATUS_LABELS[key as keyof ProblemStatusGroupDto],
        value,
        color: COLORS[key as keyof typeof COLORS],
      }));
  }, [statusData]);

  if (!statusData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center h-80">
        <p className="text-gray-400 text-sm">No status data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {title && <h3 className="text-center font-semibold text-gray-900 mb-4">{title}</h3>}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => {
                const percentage = percent !== undefined ? (percent * 100).toFixed(0) : "0";
                return `${name}: ${percentage}%`;
              }}
              labelLine={false}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="#fff" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [`${value} problems`, name]}
              contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e5e7eb" }}
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              formatter={(value) => <span className="text-xs text-gray-600">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}