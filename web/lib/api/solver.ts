// lib/api/solver.ts
import { apiRequest } from "../api";
import type { ProblemResponse } from "@/types/problem";
import type { SubmitSolutionData } from "@/types/solver";

// Fetches problems tailored to the solver (MVP: returns all OPEN problems)
export async function getRecommendedProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems?status=OPEN", {
    method: "GET",
  });
}

// Triggers the claim action and ledger update
export async function claimProblem(problemId: string): Promise<void> {
  return apiRequest<void>(`/problems/${problemId}/claim`, {
    method: "POST",
  });
}

// Submits the final solution payload
export async function submitSolution(
  problemId: string,
  data: SubmitSolutionData
): Promise<void> {
  return apiRequest<void>(`/problems/${problemId}/solutions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getActiveProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/solver/active", {
    method: "GET",
  });
}