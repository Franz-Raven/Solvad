import { apiRequest } from "../api";
import type { SolutionAttemptResponse, SubtaskSubmissionResponse } from "@/types/attempt";

/**
 * Claim a problem (solver)
 */
export async function claimProblem(problemId: string): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/problems/${problemId}/claim`, {
    method: "POST",
  });
}

/**
 * Abandon an active claim (solver)
 */
export async function abandonClaim(problemId: string): Promise<void> {
  return apiRequest<void>(`/problems/${problemId}/claim`, {
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

/**
 * Save draft or submit a subtask solution (multipart)
 */
export async function saveOrSubmitSubtask(
  attemptId: string,
  subtaskId: string,
  description: string,
  action: "SAVE_DRAFT" | "SUBMIT",
  files?: File[]
): Promise<SubtaskSubmissionResponse> {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("action", action);
  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file));
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/attempts/${attemptId}/subtasks/${subtaskId}`,
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type — browser sets it with boundary for multipart
      },
      body: formData,
    }
  );

  const contentType = res.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await res.json()
    : await res.text();

  if (!res.ok) {
    const msg =
      typeof data === "object" && data !== null
        ? (data as any).message || (data as any).error || "Request failed"
        : String(data);
    throw new Error(msg);
  }

  return data as SubtaskSubmissionResponse;
}

/**
 * Delete a file from a draft submission
 */
export async function deleteFileFromSubmission(
  submissionId: string,
  fileUrl: string
): Promise<SubtaskSubmissionResponse> {
  return apiRequest<SubtaskSubmissionResponse>(
    `/submissions/${submissionId}/files?fileUrl=${encodeURIComponent(fileUrl)}`,
    { method: "DELETE" }
  );
}

/**
 * Get all attempts for a problem (seeker — attempt tree)
 */
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