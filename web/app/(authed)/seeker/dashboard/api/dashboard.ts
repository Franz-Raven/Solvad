import { apiRequest } from "@/lib/api";
import type {
  ProblemResponse,
  PaginatedNotificationsResponse,
  SeekerProblemListResponse,
  PaginatedProblemsResponse
} from "@/types/problem";


export async function getMyProblems(): Promise<ProblemResponse[]> {
  return apiRequest<ProblemResponse[]>("/problems/my-problems", {
    method: "GET",
  });
}

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

export async function getSeekerNotifications(
  eventType: string = "all",
  page: number = 0,
  size: number = 10
): Promise<PaginatedNotificationsResponse> {
  const params = new URLSearchParams();
  if (eventType && eventType !== "all") params.set("eventType", eventType);
  params.set("page", page.toString());
  params.set("size", size.toString());

  return apiRequest<PaginatedNotificationsResponse>(`/problems/notifications?${params.toString()}`, {
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