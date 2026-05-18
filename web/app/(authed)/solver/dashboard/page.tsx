"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecommendedProblems, claimProblem } from "@/lib/api/solver";
import type { ProblemResponse } from "@/types/problem";

export default function SolverDashboardPage() {
  const [problems, setProblems] = useState<ProblemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchProblems = async () => {
    try {
      setLoading(true);
      const data = await getRecommendedProblems();
      setProblems(data);
    } catch (error) {
      console.error("Failed to fetch matched problems:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const handleClaim = async (problemId: string) => {
    try {
      setClaimingId(problemId);
      await claimProblem(problemId);
      
      // Optimistic UI Update: Instantly remove the claimed problem from the local state
      // This guarantees a sub-3-second refresh time without waiting for another network request
      setProblems((prev) => prev.filter((p) => p.id !== problemId));
      
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

        {/* Dashboard Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Available Problems</h3>
            <p className="text-3xl font-bold text-accent">{problems.length}</p>
            <p className="text-sm text-gray-600 mt-2">New challenges matched to your profile</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Active Projects</h3>
            <p className="text-3xl font-bold text-secondary">0</p>
            <p className="text-sm text-gray-600 mt-2">Currently working on</p>
          </div>
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Completed</h3>
            <p className="text-3xl font-bold text-primary-foreground">0</p>
            <p className="text-sm text-gray-600 mt-2">Successfully solved</p>
          </div>
        </div>

        {/* Matched Problems Feed */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Matched Problems</h2>
            <button 
              onClick={fetchProblems}
              className="text-sm text-secondary hover:text-accent font-medium"
            >
              Refresh Algorithm
            </button>
          </div>

          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8">
                <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : problems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No open problems matched your profile at this time.</p>
            ) : (
              problems.map((problem) => (
                <div
                  key={problem.id}
                  className="flex flex-col md:flex-row items-start md:items-center gap-4 p-5 bg-gray-50 rounded-lg hover:bg-accent/5 transition-colors border border-gray-200"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-semibold text-gray-900 text-lg">
                        {problem.title}
                      </h4>
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {problem.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {problem.primaryStatement}
                    </p>
                    <div className="flex gap-2">
                      <span className="text-xs font-medium text-secondary bg-secondary/10 px-2 py-1 rounded">
                        {problem.requiredCourse}
                      </span>
                      <span className="text-xs text-gray-500 py-1">
                        {problem.subtasks.length} Sub-tasks
                      </span>
                    </div>
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