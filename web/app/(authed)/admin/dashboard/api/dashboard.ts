import { apiRequest } from "@/lib/api";
import type {
  AdminActivity,
  AdminAnalytics,
  AdminDashboardStats,
  AdminListedRole,
  AdminPage,
  AdminProblem,
  AdminUser,
} from "@/types/admin";

function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") search.set(key, String(value));
  });
  return search.toString();
}

export async function getAdminStats(): Promise<AdminDashboardStats> {
  return apiRequest<AdminDashboardStats>("/admin/dashboard/stats", { method: "GET" });
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  return apiRequest<AdminAnalytics>("/admin/dashboard/analytics", { method: "GET" });
}

export async function getAdminActivity(
  eventType: string = "all",
  page: number = 0,
  size: number = 10
): Promise<AdminPage<AdminActivity>> {
  const qs = buildQuery({ eventType: eventType === "all" ? undefined : eventType, page, size });
  return apiRequest<AdminPage<AdminActivity>>(`/admin/dashboard/activity?${qs}`, { method: "GET" });
}

export async function getAdminUsers(
  role: AdminListedRole,
  search: string = "",
  page: number = 0,
  size: number = 10
): Promise<AdminPage<AdminUser>> {
  const qs = buildQuery({ role, search: search.trim(), page, size });
  return apiRequest<AdminPage<AdminUser>>(`/admin/dashboard/users?${qs}`, { method: "GET" });
}

export async function getAdminProblems(
  status: string = "all",
  search: string = "",
  page: number = 0,
  size: number = 10
): Promise<AdminPage<AdminProblem>> {
  const qs = buildQuery({ status: status === "all" ? undefined : status, search: search.trim(), page, size });
  return apiRequest<AdminPage<AdminProblem>>(`/admin/dashboard/problems?${qs}`, { method: "GET" });
}
