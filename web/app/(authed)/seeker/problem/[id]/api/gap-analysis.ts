import { apiRequest } from "@/lib/api";

export interface GapAnalysisResponse {
  executiveSummary: string;
  featureDifferences: string[];
  technicalDeviations: string[];
  uniqueContributions: string[];
  recommendation: string;
}

export async function fetchGapAnalysis(
  newProblemId: string,
  historicalProblemId: string,
  refresh = false
): Promise<GapAnalysisResponse> {
  const url = `/gap-analysis?newProblemId=${newProblemId}&historicalProblemId=${historicalProblemId}${refresh ? '&refresh=true' : ''}`;
  return apiRequest<GapAnalysisResponse>(url, { method: "GET" });
}