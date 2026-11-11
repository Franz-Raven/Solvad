"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import type { ProblemStatusGroupDto } from "@/types/dashboard.types";

interface DonutChartProps {
  statusData: ProblemStatusGroupDto | null;
  title?: string;
}

// Solvad theme: greens deepen as a problem progresses toward completion,
// amber marks in-flight work (matches "Pending" badges), slate marks closed.
const STATUS_COLORS: Record<keyof ProblemStatusGroupDto, string> = {
  open: "var(--accent)",
  active: "#f59e0b",
  solvedNeedsImprovement: "var(--secondary)",
  completed: "var(--primary-foreground)",
  closed: "#94a3b8",
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
              // Percent-only labels in neutral slate: full names live in the legend,
              // so long names like "Solved (Needs Improvement)" no longer get clipped.
              label={({ x, y, percent, textAnchor }) => (
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  dominantBaseline="central"
                  className="fill-slate-500 text-xs font-semibold"
                >
                  {`${Math.round((percent ?? 0) * 100)}%`}
                </text>
              )}
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
              itemSorter={null} // keep lifecycle order (Open → Closed) instead of alphabetical
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