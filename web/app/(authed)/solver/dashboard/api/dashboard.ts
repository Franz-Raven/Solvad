import { apiRequest } from "@/lib/api";
import type { 
  DiscoveryDashboardResponse, 
  PaginatedProblemsResponse 
} from "@/types/problem";
import type { SolutionAttemptResponse, PaginatedAttemptsResponse, PaginatedClaimsResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";
import type { ClaimDetail, AttemptDetail } from "@/types/attempt";

export interface DiscoveryQuery {
  search?: string;
  tags?: string;
}


export async function getMyAttempts(): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>("/attempts/my", {
    method: "GET",
  });
}

export async function getDiscoveryDashboard(
  query: DiscoveryQuery = {}
): Promise<DiscoveryDashboardResponse> {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.tags) params.set("tags", query.tags);
  
  const qs = params.toString();
  return apiRequest<DiscoveryDashboardResponse>(
    `/problems/discovery${qs ? `?${qs}` : ""}`,
    { method: "GET" }
  );
}

export async function getDiscoverableProblems(
  page: number = 0,
  size: number = 5
): Promise<PaginatedProblemsResponse> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("size", size.toString());
  
  return apiRequest<PaginatedProblemsResponse>(
    `/problems/discover?${params.toString()}`,
    { method: "GET" }
  );
}

export async function getMyActiveAttempts(): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>("/attempts/my-attempts", {
    method: "GET",
  });
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

export async function getOpenProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/open", {
    method: "GET",
  });
}

// 🚀 NEW: Lightweight active attempts count endpoint
export async function getMyActiveAttemptsCount(): Promise<number> {
  const response = await apiRequest<{ activeCount: number }>("/attempts/active/count", {
    method: "GET",
  });
  return response.activeCount;
}
export async function getPendingClaims(
  page: number = 0,
  size: number = 5
): Promise<PaginatedClaimsResponse> {
  const params = new URLSearchParams();
  params.set("page", page.toString());
  params.set("size", size.toString());
  
  // Make sure this matches the backend endpoint you mapped!
  return apiRequest<PaginatedClaimsResponse>(
    `/claims/my-pending?${params.toString()}`,
    { method: "GET" }
  );
}

export async function getClaimDetails(id: string): Promise<ClaimDetail> {
  return apiRequest<ClaimDetail>(`/claims/${id}`, { method: "GET" });
}

export async function getAttemptDetails(id: string): Promise<AttemptDetail> {
  return apiRequest<AttemptDetail>(`/attempts/history/${id}`, { method: "GET" });
}