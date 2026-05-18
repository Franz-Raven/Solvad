"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecommendedProblems, getActiveProblems, claimProblem } from "@/lib/api/solver";
import type { ProblemResponse } from "@/types/problem";

export default function SolverDashboardPage() {
  const [availableProblems, setAvailableProblems] = useState<ProblemResponse[]>([]);
  const [activeProblems, setActiveProblems] = useState<ProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Fetch both feeds in parallel
      const [recommended, active] = await Promise.all([
        getRecommendedProblems(),
        getActiveProblems()
      ]);
      setAvailableProblems(recommended);
      setActiveProblems(active);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleClaim = async (problemId: string) => {
    try {
      setClaimingId(problemId);
      await claimProblem(problemId);
      
      // Optimistic UI: Find the problem, move it from Available to Active
      const claimedProblem = availableProblems.find(p => p.id === problemId);
      if (claimedProblem) {
        setAvailableProblems(prev => prev.filter(p => p.id !== problemId));
        setActiveProblems(prev => [{ ...claimedProblem, status: "CLAIMED" }, ...prev]);
      }
      
      alert("Problem successfully claimed! It is now in your active projects.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to claim problem");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4">
            Bridging the Gap Between Industry Problems and Academic Solutions.
          </h1>
          <p className="text-lg md:text-xl text-gray-700 max-w-4xl mx-auto">
            Empowering student solvers to tackle real-world cross-industry challenges while building a verifiable portfolio.
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Problems</h3>
            <p className="text-3xl font-bold text-accent">{availableProblems.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-secondary">{activeProblems.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-foreground">0</p>
          </div>
        </div>

        {/* ACTIVE PROJECTS FEED */}
        {activeProblems.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-secondary/20 p-8 mb-12 border-t-4 border-t-secondary">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Active Projects</h2>
            <div className="space-y-4">
              {activeProblems.map((problem) => (
                <div key={problem.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 bg-secondary/5 rounded-lg border border-secondary/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900 text-lg">{problem.title}</h4>
                      <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                        {problem.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-1">{problem.primaryStatement}</p>
                  </div>
                  <Link
                    href={`/solver/problem/${problem.id}`}
                    className="px-6 py-2 bg-secondary hover:bg-secondary/90 text-white text-sm font-bold rounded-lg transition-colors whitespace-nowrap"
                  >
                    Open Workspace
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MATCHED PROBLEMS FEED */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Matched Problems</h2>
            <button onClick={fetchDashboardData} className="text-sm text-accent hover:text-secondary font-medium">
              Refresh Algorithm
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : availableProblems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No open problems matched your profile at this time.</p>
            ) : (
              availableProblems.map((problem) => (
                <div key={problem.id} className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 text-lg mb-1">{problem.title}</h4>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{problem.primaryStatement}</p>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
                    <Link
                      href={`/solver/problem/${problem.id}`}
                      className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-lg transition-colors flex-1 text-center"
                    >
                      View Details
                    </Link>
                    <button 
                      onClick={() => handleClaim(problem.id)}
                      disabled={claimingId === problem.id}
                      className="px-4 py-2 bg-accent hover:bg-secondary disabled:bg-accent/50 text-white text-sm font-medium rounded-lg transition-colors flex-1"
                    >
                      {claimingId === problem.id ? "Claiming..." : "Claim Problem"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}