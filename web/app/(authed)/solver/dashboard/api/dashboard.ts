import { apiRequest } from "@/lib/api";
import type { 
  DiscoveryDashboardResponse, 
  PaginatedProblemsResponse 
} from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
import type { ProblemResponse } from "@/types/problem";

export interface DiscoveryQuery {
  search?: string;
  tags?: string;
}

import { PaginatedAttemptsResponse } from "@/types/attempt";


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
