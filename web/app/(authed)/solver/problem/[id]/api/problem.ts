import { apiRequest } from "@/lib/api";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse, AuditLogEntry } from "@/types/attempt";


export async function getProblemById(
  problemId: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}`, {
    method: "GET",
  });
}

export async function getAllAttempts(
  problemId: string
): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>(`/problems/${problemId}/attempts`, {
    method: "GET",
  });
}

export async function getMyAttempt(
  problemId: string
): Promise<SolutionAttemptResponse> {

  return apiRequest<SolutionAttemptResponse>(`/problems/${problemId}/my-attempt`, {
    method: "GET",
  });
}


export async function getMyProposalStatus(
  problemId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`/problems/${problemId}/proposals/my-status`, {
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

export async function submitProposal(
  problemId: string,
  proposedApproach: string,
  subtaskId: string,
  parentAttemptId?: string,
  files?: File[]
): Promise<void> {
  const formData = new FormData();
  formData.append("proposedApproach", proposedApproach);
  formData.append("subtaskId", subtaskId);
  
  if (parentAttemptId) {
    formData.append("parentAttemptId", parentAttemptId);
  }
  
  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file));
  }

  return apiRequest<void>(`/problems/${problemId}/proposals`, {
    method: "POST",
    body: formData,
  });
}