import { apiRequest } from "@/lib/api";
import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";
/**
 * Fetches the full details of a specific problem for the Solver view.
 */
export async function getProblemById(
  problemId: string
): Promise<ProblemResponse> {
  return apiRequest<ProblemResponse>(`/problems/${problemId}`, {
    method: "GET",
  });
}

export async function getAllAttempts(
  problemId: string
): Promise<SolutionAttemptResponse[]> {
  return apiRequest<SolutionAttemptResponse[]>(`/problems/${problemId}/attempts`, {
    method: "GET",
  });
}
