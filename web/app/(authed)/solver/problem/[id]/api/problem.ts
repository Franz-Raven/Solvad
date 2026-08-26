import { apiRequest } from "@/lib/api";
import type { ProblemResponse } from "@/types/problem";

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