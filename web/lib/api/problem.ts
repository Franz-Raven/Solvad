import { apiRequest } from "../api";
import type {
  DiscoveryDashboardResponse,
  GenerateScopeRequest,
  GenerateScopeResponse,
  ProblemRequest,
  ProblemResponse,
  SeekerNotification,
  PaginatedProblemsResponse,
} from "@/types/problem";
import type { ClaimRequestResponse } from "@/types/attempt";

export async function generateScope(
  data: GenerateScopeRequest
): Promise<GenerateScopeResponse> {
  console.log("=== GENERATE SCOPE REQUEST ===");
  console.log("Request Data:", data);
  console.log("Attachments count:", data.attachments?.length || 0);
  
  const formData = new FormData();
  
  // Add the JSON data as a string
  const { attachments, ...requestData } = data;
  formData.append('data', JSON.stringify(requestData));
  
  // Add file attachments if present
  if (attachments && attachments.length > 0) {
    attachments.forEach((file) => {
      console.log(`Attaching file: ${file.name} (${file.type}, ${file.size} bytes)`);
      formData.append('attachments', file);
    });
  }
  
  // Use FormData instead of JSON
  const response = await apiRequest<GenerateScopeResponse>("/problems/generate-scope", {
    method: "POST",
    body: formData,
    // Don't set Content-Type header - FormData will set it with boundary
  });
  
  console.log("=== GENERATE SCOPE RESPONSE ===");
  console.log("Generated Subtasks:", response.generatedSubtasks);
  console.log("Subtasks count:", response.generatedSubtasks?.length || 0);
  
  return response;
}

export async function createProblem(
  data: ProblemRequest
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>("/problems", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/my-problems", {
    method: "GET",
  });
}

export async function searchMyProblems(
  query?: string,
  sdgFilter?: string,
  dateSort?: string,
  page: number = 0,
  size: number = 20
): Promise<PaginatedProblemsResponse> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (sdgFilter) params.set("sdgFilter", sdgFilter);
  if (dateSort) params.set("dateSort", dateSort);
  params.set("page", page.toString());
  params.set("size", size.toString());
  
  return apiRequest<PaginatedProblemsResponse>(
    `/problems/my-problems/search?${params.toString()}`,
    { method: "GET" }
  );
}

export async function getProblemById(
  problemId: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}`, {
    method: "GET",
  });
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

/**
 * Get all OPEN problems (solver browse)
 */
export async function getOpenProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/open", {
    method: "GET",
  });
}

export interface DiscoveryQuery {
  search?: string;
  tags?: string;
  sort?: "newest" | "oldest";
}

/**
 * Module 2 — discovery dashboard with recommendations and filters
 */
export async function getDiscoveryDashboard(
  query: DiscoveryQuery = {}
): Promise<DiscoveryDashboardResponse> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.tags) params.set("tags", query.tags);
  if (query.sort) params.set("sort", query.sort);
  const qs = params.toString();
  return apiRequest<DiscoveryDashboardResponse>(
    `/problems/discovery${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );
}

/**
 * Module 2 — seeker notifications (claims, status changes)
 */
export async function getSeekerNotifications(): Promise<SeekerNotification[]> {
  return apiRequest<SeekerNotification[]>("/problems/notifications", {
    method: "GET",
  });
}

export async function getPendingProposals(problemId: string): Promise<ClaimRequestResponse[]> {
  return apiRequest(`/problems/${problemId}/proposals/pending`);
}

/**
 * Evaluates a proposal. If approved, the backend generates the active workspace.
 */
export async function evaluateProposal(proposalId: string, isApproved: boolean): Promise<string> {
  return apiRequest(`/proposals/${proposalId}/evaluate?isApproved=${isApproved}`, {
    method: "POST",
  });
}

// Add this to your api/problem.ts file

export async function updateProblemMaxSolvers(problemId: string, maxSolvers: number): Promise<void> {
  const token = localStorage.getItem("token"); // Adjust this to match how you store your JWT

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