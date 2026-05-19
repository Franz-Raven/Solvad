import { apiRequest } from "../api";
import type { SolutionAttemptResponse, SubtaskSubmissionResponse } from "@/types/attempt";

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
  files?: File[],
  deltaDescription?: string // <-- ADDED PARAMETER
): Promise<SubtaskSubmissionResponse> {
  const formData = new FormData();
  formData.append("description", description);
  formData.append("action", action);
  if (deltaDescription) {
    formData.append("deltaDescription", deltaDescription); // <-- ADDED
  }
  if (files && files.length > 0) {
    files.forEach((file) => formData.append("files", file)); // [cite: 487-488]
  }

  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null; // [cite: 488]
  const res = await fetch( // [cite: 489]
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"}/attempts/${attemptId}/subtasks/${subtaskId}`, // [cite: 489]
    {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // [cite: 489]
      },
      body: formData,
    }
  ); // [cite: 489]

  const contentType = res.headers.get("content-type") || ""; // [cite: 490]
  const data = contentType.includes("application/json") // [cite: 490]
    ? await res.json() // [cite: 490-491]
    : await res.text(); // [cite: 491]

  if (!res.ok) { // [cite: 491]
    const msg = // [cite: 491]
      typeof data === "object" && data !== null // [cite: 491]
        ? (data as any).message || (data as any).error || "Request failed" // [cite: 492]
        : String(data); // [cite: 492]
    throw new Error(msg); 
  }

  return data as SubtaskSubmissionResponse;
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

export async function getMyActiveAttempts(): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>("/attempts/my-attempts", {
    method: "GET",
  });
}

/**
 * Submit the entire solution attempt (Solver)
 */
export async function submitFullAttempt(
  attemptId: string
): Promise<SolutionAttemptResponse> {
  return apiRequest<SolutionAttemptResponse>(`/attempts/${attemptId}/submit`, {
    method: "POST",
  });
}