// lib/api/activity.ts
import { apiRequest } from "../api";
import type { ActivityLedgerResponse, DocumentUploadRequest } from "@/types/activity";

export async function getActivityFeed(problemId: string): Promise<ActivityLedgerResponse[]> {
  return apiRequest<ActivityLedgerResponse[]>(`/problems/${problemId}/activity`, {
    method: "GET",
  });
}

export async function registerDocument(
  problemId: string,
  data: DocumentUploadRequest
): Promise<string> {
  return apiRequest<string>(`/problems/${problemId}/documents`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}