"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ProblemStatusGroupDto } from "@/types/dashboard.types";

interface DonutChartProps {
  statusData: ProblemStatusGroupDto | null;
  title?: string;
}

const STATUS_COLORS: Record<keyof ProblemStatusGroupDto, string> = {
  open: "#3b82f6",
  active: "#f97316",
  solvedNeedsImprovement: "#8b5cf6",
  completed: "#ef4444",
  closed: "#fbbf24",
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
        color: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
      }));
  }, [statusData]);

  if (!statusData || chartData.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center justify-center h-80">
        <p className="text-gray-400 text-sm">No status data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      {title && <h3 className="font-semibold text-gray-900 mb-4 text-center">{title}</h3>}
      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
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
                formatter={(value, name) => [`${value} problems`, name]}
                contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "0.5rem",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                }}
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