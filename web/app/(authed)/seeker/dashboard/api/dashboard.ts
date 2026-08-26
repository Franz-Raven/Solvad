import { apiRequest } from "@/lib/api";
import type {
  ProblemResponse,
  SeekerNotification,
  SeekerProblemListResponse,
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

export async function getSeekerNotifications(): Promise<SeekerNotification[]> {
  return apiRequest<SeekerNotification[]>("/problems/notifications", {
    method: "GET",
  });
}