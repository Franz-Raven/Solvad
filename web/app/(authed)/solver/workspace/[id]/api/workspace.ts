import { apiRequest } from "@/lib/api";
import type { SolutionAttemptResponse, SubtaskSubmissionResponse } from "@/types/attempt";

/**
 * Get a single attempt by ID to load the workspace
 */
export async function getAttemptById(
  attemptId: string
): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/attempts/${attemptId}`, {
    method: "GET",
  });
}

/**
 * Abandon an active claim
 */
export async function abandonClaim(attemptId: string): Promise<void> {
  await apiRequest(`/attempts/${attemptId}/abandon`, {
    method: "DELETE",
  });
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
    method: "PUT",
    body: formData,
  });
}

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


  return apiRequest<SubtaskSubmissionResponse>(
    `/attempts/${attemptId}/subtasks/${subtaskId}/submit`,
    {
      method: "POST",
      body: formData,
    }
  );
}

export async function submitFullAttempt(
  attemptId: string
): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/attempts/${attemptId}/complete`, {
    method: "POST",
  });
}

export async function getMyAttempt(problemId: string): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/problems/${problemId}/my-attempt`, {
    method: "GET",
  });
}