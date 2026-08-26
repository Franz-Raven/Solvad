"use client";

import Link from "next/link";
import { Sparkles, Building2, GraduationCap } from "lucide-react";
import type { ProblemResponse } from "@/types/problem";

interface RecommendationsListProps {
  isLoading: boolean;
  recommendations: ProblemResponse[];
}

export function RecommendationsList({ isLoading, recommendations }: RecommendationsListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-secondary/30 p-8 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-secondary" />
          Recommended for You
        </h2>
        <span className="text-xs text-gray-500">Top 3 matches from your skills & course</span>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-100 bg-gray-50 animate-pulse relative h-[132px] overflow-hidden">
              <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-gray-300/60" />
              <div className="pl-8 space-y-3 mt-1">
                <div className="space-y-2">
                  <div className="h-3.5 bg-gray-300/60 rounded w-full" />
                  <div className="h-3.5 bg-gray-300/60 rounded w-2/3" />
                </div>
                <div className="h-2.5 bg-gray-200/60 rounded w-4/5 pt-2" />
                <div className="h-5 w-20 bg-green-100/60 rounded-full mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : recommendations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.slice(0, 3).map((problem, rank) => (
            <Link
              key={problem.id}
              href={`/solver/problem/${problem.id}`}
              className="block p-4 rounded-xl border border-secondary/20 bg-secondary/5 hover:border-secondary hover:shadow-md transition-all relative group"
            >
              <span className="absolute top-3 left-3 w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center shadow-sm">
                {rank + 1}
              </span>
              <div className="flex items-start justify-between gap-2 mb-3 pl-8">
                <h4 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-secondary transition-colors">
                  {problem.title}
                </h4>
                {problem.matchScore != null && (
                  <span className="text-xs font-bold text-secondary whitespace-nowrap bg-white px-2 py-0.5 rounded-md border border-secondary/20 shadow-sm">
                    {Math.round(problem.matchScore * 100)}% match
                  </span>
                )}
              </div>
              <div className="space-y-1.5 pl-8">
                <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                  <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{problem.organizationName}</span>
                </p>
                <p className="text-xs text-gray-600 flex items-center gap-1.5 truncate">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span className="truncate">{problem.preferredProgram}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">No recommendations available at this time.</p>
      )}
    </div>
  );
}