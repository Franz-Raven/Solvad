import { apiRequest } from "@/lib/api";
import type { ProblemResponse } from "@/types/problem";
import type { ClaimRequestResponse } from "@/types/attempt";
import type { SolutionAttemptResponse } from "@/types/attempt";


/**
 * Fetches the full details of a specific problem.
 */
export async function getProblemById(
  problemId: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}`, {
    method: "GET",
  });
}

/**
 * Fetches all pending proposals (job applications) for this specific problem.
 */
export async function getPendingProposals(
  problemId: string
): Promise<ClaimRequestResponse[]> {
  return apiRequest<ClaimRequestResponse[]>(`/problems/${problemId}/proposals/pending`, {
    method: "GET",
  });
}

/**
 * Evaluates a proposal from a solver. 
 * If approved, the backend generates the active workspace for them.
 */
export async function evaluateProposal(
  proposalId: string, 
  isApproved: boolean
): Promise<string> {
  return apiRequest(`/proposals/${proposalId}/evaluate?isApproved=${isApproved}`, {
    method: "POST",
  });
}

/**
 * Marks the problem as fully solved and closes all active workspaces.
 */
export async function markAsSolved(
  problemId: string
): Promise<void> {
  return apiRequest(`/problems/${problemId}/mark-solved`, {
    method: "POST",
  });
}

/**
 * Updates the maximum number of concurrent solvers allowed for this problem.
 */
export async function updateProblemMaxSolvers(
  problemId: string, 
  maxSolvers: number
): Promise<void> {
  const token = localStorage.getItem("token"); 

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/problems/${problemId}/max-solvers?maxSolvers=${maxSolvers}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(errorMessage || "Failed to update maximum concurrent solvers");
  }
}

/**
 * Updates the overall status of the problem (e.g., OPEN, CLOSED).
 */
export async function updateProblemStatus(
  problemId: string,
  status: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * Permanently deletes the problem.
 */
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
