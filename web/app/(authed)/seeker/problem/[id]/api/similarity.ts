import { apiRequest } from "../../../../../../lib/api";
import type { SimilarityResponse } from "@/types/similarity";

export async function fetchSimilarityInsights(
  problemId: string
): Promise<SimilarityResponse> {
  return apiRequest<SimilarityResponse>(`/v1/problems/${problemId}/similarity`, {
    method: "GET",
  });
}