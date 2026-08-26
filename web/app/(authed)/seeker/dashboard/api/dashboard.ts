import { apiRequest } from "@/lib/api";
import type {
  ProblemResponse,
  SeekerNotification,
  SeekerProblemListResponse,
} from "@/types/problem";

/**
 * Fetches all problems for the seeker to calculate overview statistics.
 */
export async function getMyProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/my-problems", {
    method: "GET",
  });
}

/**
 * Fetches the paginated list of problems for the Seeker's "Posted Problems" tab.
 */
export async function getSeekerProblemList(
  query?: string,
  sdgFilter?: string,
  dateSort?: string,
  page: number = 0,
  size: number = 5
): Promise<SeekerProblemListResponse> {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (sdgFilter) params.set("sdgFilter", sdgFilter);
  if (dateSort) params.set("dateSort", dateSort);
  params.set("page", page.toString());
  params.set("size", size.toString());
  
  return apiRequest<SeekerProblemListResponse>(
    `/problems/seeker/list?${params.toString()}`,
    { method: "GET" }
  );
}

/**
 * Fetches recent activity/notifications for the Seeker's timeline.
 */
export async function getSeekerNotifications(): Promise<SeekerNotification[]> {
  return apiRequest<SeekerNotification[]>("/problems/notifications", {
    method: "GET",
  });
}