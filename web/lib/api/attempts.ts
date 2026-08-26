import { apiRequest } from "../api";
import type { SolutionAttemptResponse, SubtaskSubmissionResponse } from "@/types/attempt";
import type { AuditLogEntry } from "@/types/attempt";
import type { ProposalRequest, ClaimRequestResponse } from "@/types/attempt";

/**
 * Claim a problem (solver)
 */
export async function claimProblem(problemId: string, parentAttemptId?: string): Promise<SolutionAttemptResponse> {
  const url = parentAttemptId
    ? `/problems/${problemId}/claim?parentAttemptId=${parentAttemptId}`
    : `/problems/${problemId}/claim`;

  return apiRequest<SolutionAttemptResponse>(url, {
    method: "POST",
  });
}

/**
 * Abandon an active claim (solver)
 */
export async function abandonClaim(attemptId: string): Promise<void> {
  await apiRequest(`/attempts/${attemptId}/abandon`, {
    method: "DELETE",
  });
}

/**
 * Get solver's active attempt on a problem
 */
export async function getMyAttempt(problemId: string): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/problems/${problemId}/my-attempt`, {
    method: "GET",
  });
}

export async function deleteFileFromSubmission(
  submissionId: string,
  fileUrl: string
): Promise<SubtaskSubmissionResponse> {
  return apiRequest<SubtaskSubmissionResponse>(
    `/submissions/${submissionId}/files?fileUrl=${encodeURIComponent(fileUrl)}`,
    { method: "DELETE" }
  );
}

export async function saveSubtaskDraft(
  attemptId: string,
  subtaskId: string,
  description: string,
  deltaDescription: string,
  files: File[]
): Promise<SubtaskSubmissionResponse> {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("deltaDescription", deltaDescription);
  files.forEach((file) => formData.append("files", file));

  return apiRequest<SubtaskSubmissionResponse>(`/attempts/${attemptId}/subtasks/${subtaskId}/draft`, {
    method: "PUT", // SDD states PUT for draft
    body: formData,
  });
}

export async function submitSubtaskSolution(
  attemptId: string,
  subtaskId: string,
  description: string,
  deltaDescription: string,
  files: File[]
): Promise<SubtaskSubmissionResponse> {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("deltaDescription", deltaDescription);
  files.forEach((file) => formData.append("files", file));

  return apiRequest<SubtaskSubmissionResponse>(`/attempts/${attemptId}/subtasks/${subtaskId}/submit`, {
    method: "POST", // SDD states POST for submit
    body: formData,
  });
}

/**
 * Lock and Submit a subtask solution (Multipart/Supabase)
 */
export async function submitSubtaskFinal(
  attemptId: string,
  subtaskId: string,
  description: string,
  deltaDescription?: string,
  files?: File[]
): Promise<SubtaskSubmissionResponse> {
  const formData = new FormData();
  formData.append("description", description);
  if (deltaDescription) formData.append("deltaDescription", deltaDescription);
  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file));
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/attempts/${attemptId}/subtasks/${subtaskId}/submit`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  const data = await res.json().catch(() => res.text());
  if (!res.ok) throw new Error(data.message || data.error || "Failed to submit subtask");
  return data as SubtaskSubmissionResponse;
}

/**
 * Complete the entire attempt (Solver Action)
 * Backend endpoint: POST /api/attempts/{attemptId}/complete
 */
export async function completeAttempt(attemptId: string): Promise<SolutionAttemptResponse> {
  return apiRequest(`/attempts/${attemptId}/complete`, { method: "POST" });
}


export async function getAllAttempts(
  problemId: string
): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>(`/problems/${problemId}/attempts`, {
    method: "GET",
  });
}

/**
 * Get a single attempt by ID
 */
export async function getAttemptById(
  attemptId: string
): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/attempts/${attemptId}`, {
    method: "GET",
  });
}

/**
 * Mark problem as solved (seeker)
 */
export async function markAsSolved(
  problemId: string
): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/problems/${problemId}/mark-solved`, {
    method: "POST",
  });
}

export async function getMyActiveAttempts(): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>("/attempts/my-attempts", {
    method: "GET",
  });
}

/**
 * Submit the entire solution attempt (Solver)
 * Calls POST /api/attempts/{attemptId}/complete — the backend's finalize endpoint.
 * Requires at least one subtask to be SUBMITTED, or the backend returns 400.
 */
export async function submitFullAttempt(
  attemptId: string
): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/attempts/${attemptId}/complete`, {
    method: "POST",
  });
}

/**
 * Check solver's own proposal status for a problem (read-only, no side effects)
 * Returns "PENDING" | "APPROVED" | "REJECTED" | "NONE"
 */
export async function getMyProposalStatus(
  problemId: string
): Promise<"PENDING" | "APPROVED" | "REJECTED" | "NONE"> {
  const res = await apiRequest<{ status: string }>(
    `/problems/${problemId}/proposals/my-status`,
    { method: "GET" }
  );
  return res.status as "PENDING" | "APPROVED" | "REJECTED" | "NONE";
}

export async function getAuditLog(
  problemId: string
): Promise<AuditLogEntry[]> {
  return apiRequest<AuditLogEntry[]>(`/problems/${problemId}/audit-log`, {
    method: "GET",
  });
}

export async function submitProposal(
  problemId: string,
  proposedApproach: string,
  subtaskId: string,           // ADD — now required
  parentAttemptId?: string,
  files?: File[]
): Promise<ClaimRequestResponse> {
  const formData = new FormData();
  formData.append("proposedApproach", proposedApproach);
  formData.append("subtaskId", subtaskId);              // ADD
  if (parentAttemptId) formData.append("parentAttemptId", parentAttemptId);
  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file));
  }
  return apiRequest<ClaimRequestResponse>(`/problems/${problemId}/proposals`, {
    method: "POST",
    body: formData,
  });
}

export async function getAttemptsForSubtask(
  problemId: string,
  subtaskId: string
): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>(
    `/problems/${problemId}/subtasks/${subtaskId}/attempts`,
    { method: "GET" }
  );
}

export interface PaginatedAttemptsResponse {
  attempts: SolutionAttemptResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export async function getWorkspaceAttempts(
  tab: "ACTIVE" | "PENDING" | "HISTORY",
  page: number = 0,
  size: number = 5
): Promise<PaginatedAttemptsResponse> {
  const params = new URLSearchParams();
  params.set("tab", tab);
  params.set("page", page.toString());
  params.set("size", size.toString());
  
  return apiRequest<PaginatedAttemptsResponse>(
    `/attempts/workspace?${params.toString()}`,
    { method: "GET" }
  );
}