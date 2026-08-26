import { apiRequest } from "@/lib/api";
import type { 
  DiscoveryDashboardResponse, 
  PaginatedProblemsResponse 
} from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

export interface DiscoveryQuery {
  search?: string;
  tags?: string;
}

/**
 * Fetches all solution attempts for the solver (powers the SolverOverview and WorkspaceBanner).
 */
export async function getMyAttempts(): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>("/attempts/my", {
    method: "GET",
  });
}

/**
 * Fetches AI-recommended problems based on solver skills and courses (powers RecommendationsList).
 */
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

/**
 * Fetches server-side paginated problems for the solver (powers ExploreProblems).
 */
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