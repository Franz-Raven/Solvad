"use client";

import { useEffect, useState } from "react";
import type { ProblemStatusGroupDto, SdgDistributionDto } from "@/types/dashboard.types";
import BarChart from "@/components/charts/BarChart";
import DonutChart from "@/components/charts/DonutChart";
import { apiRequest } from "@/lib/api";

interface SeekerOverviewProps {
  totalProblems: number;
  inProgress: number;
  solved: number;
}

export function SeekerOverview({ totalProblems, inProgress, solved }: SeekerOverviewProps) {
  const [statusData, setStatusData] = useState<ProblemStatusGroupDto | null>(null);
  const [sdgData, setSdgData] = useState<SdgDistributionDto[] | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchChartData = async () => {
    try {
      const [status, sdg] = await Promise.all([
        apiRequest<ProblemStatusGroupDto>("/dashboard/status-distribution"),
        apiRequest<SdgDistributionDto[]>("/dashboard/sdg-distribution"),
      ]);
      console.log("status:", status);
      console.log("sdg:", sdg);
      setStatusData(status);
      setSdgData(sdg);
    } catch (err) {
      console.error("Failed to fetch chart data:", err);
    } finally {
      setLoading(false); // ← stays here, fires after setters in try
    }
  };
  fetchChartData();
}, []);
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Posted Problems</h3>
          <p className="text-3xl font-bold text-accent">{totalProblems}</p>
          <p className="text-sm text-gray-600 mt-2">Total problems posted</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">In Progress</h3>
          <p className="text-3xl font-bold text-secondary">{inProgress}</p>
          <p className="text-sm text-gray-600 mt-2">Being worked on</p>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Solved</h3>
          <p className="text-3xl font-bold text-primary-foreground">{solved}</p>
          <p className="text-sm text-gray-600 mt-2">Successfully completed</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading ? (
          <>
            <div className="bg-white rounded-xl shadow-md border border-gray-200 h-80 animate-pulse" />
            <div className="bg-white rounded-xl shadow-md border border-gray-200 h-80 animate-pulse" />
          </>
        ) : (
          <>
            <DonutChart statusData={statusData} title="Problem Status Distribution" />
            <BarChart sdgData={sdgData} title="Problems by SDG Focus" />
          </>
        )}
      </div>
    </div>
  );
}