import { apiRequest } from "../api";
import type { Appeal, AppealsByStatus } from "@/types/appeal";

export async function submitAppeal(problemId: string, message: string): Promise<Appeal> {
  return apiRequest<Appeal>(`/problems/${problemId}/appeal`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message }), 
  });
}

export async function getAppealsByProblem(problemId: string): Promise<AppealsByStatus> {
  return apiRequest<AppealsByStatus>(`/problems/${problemId}/appeals`, {
    method: "GET",
  });
}

export async function approveAppeal(appealId: string): Promise<Appeal> {
  return apiRequest<Appeal>(`/appeals/${appealId}/approve`, {
    method: "POST",
  });
}

export async function rejectAppeal(appealId: string): Promise<Appeal> {
  return apiRequest<Appeal>(`/appeals/${appealId}/reject`, {
    method: "POST",
  });
}
