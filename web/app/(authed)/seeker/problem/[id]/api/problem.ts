import { apiRequest } from "@/lib/api";
import type { ProblemResponse } from "@/types/problem";
import type { ClaimRequestResponse } from "@/types/attempt";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { AuditLogEntry } from "@/types/attempt";
import type { SolutionAttemptSummary } from "@/types/attempt";

export async function getProblemById(
  problemId: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}`, {
    method: "GET",
  });
}

export async function getAuditLog(
  problemId: string
): Promise<AuditLogEntry[]> {
  // ✅ Correct path matching ProblemController.java
  return apiRequest<AuditLogEntry[]>(`/problems/${problemId}/audit-log`, {
    method: "GET",
  });
}

export async function getPendingProposals(
  problemId: string
): Promise<ClaimRequestResponse[]> {
  return apiRequest<ClaimRequestResponse[]>(`/problems/${problemId}/proposals/pending`, {
    method: "GET",
  });
}

export async function evaluateProposal(
  proposalId: string, 
  isApproved: boolean
): Promise<string> {
  return apiRequest(`/proposals/${proposalId}/evaluate?isApproved=${isApproved}`, {
    method: "POST",
  });
}

export async function markAsSolved(
  problemId: string
): Promise<void> {
  return apiRequest(`/problems/${problemId}/mark-solved`, {
    method: "POST",
  });
}

export async function updateSubtaskMaxSolvers(problemId: string, subtaskId: string, maxSolvers: number) {
  return apiRequest<any>(
    `/problems/${problemId}/subtasks/${subtaskId}/max-solvers?maxSolvers=${maxSolvers}`, 
    { method: "PUT" }
  );
}

export async function updateProblemStatus(
  problemId: string,
  status: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteProblem(problemId: string): Promise<void> {
  return apiRequest<void>(`/problems/${problemId}`, {
    method: "DELETE",
  });
}


export async function getAllAttempts(
  problemId: string
): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>(`/problems/${problemId}/attempts`, {
    method: "GET",
  });
}


export async function getProblemTree(problemId: string): Promise<SolutionAttemptSummary[]> {
  return apiRequest<SolutionAttemptSummary[]>(`/problems/${problemId}/attempts/tree`, { method: "GET" });
}

export async function getFullAttemptDetails(attemptId: string): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/attempts/${attemptId}`, { method: "GET" });
}

export async function getProblemActiveAttemptsCount(problemId: string): Promise<number> {
  const res = await apiRequest<any>(`/problems/${problemId}/attempts/active-count`, { method: "GET" });
  return res.activeCount ?? res.count ?? 0; // Safely handles the Java record JSON mapping
}