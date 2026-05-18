// lib/api/solver.ts
import { apiRequest } from "../api";
import type { ProblemResponse } from "@/types/problem";

// Fetches problems tailored to the solver (MVP: returns all OPEN problems)
export async function getRecommendedProblems(): Promise<ProblemResponse[]> {
  // In a full implementation, this endpoint would execute the keyword-tagging algorithm
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