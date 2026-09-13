import { apiRequest } from "@/lib/api";
import type { ProblemResponse } from "@/types/problem";
import type { ClaimRequestResponse } from "@/types/attempt";
import type { SolutionAttemptResponse } from "@/types/attempt";
import { AuditLogEntry } from "@/types/attempt";

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
  const token = localStorage.getItem("token");
  const res = await fetch(`http://localhost:8080/api/problems/${problemId}/subtasks/${subtaskId}/max-solvers?maxSolvers=${maxSolvers}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || "Failed to update limit");
  }
  return res.json();
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

