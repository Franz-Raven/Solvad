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
  historicalProblemId: string
): Promise<GapAnalysisResponse> {
  return apiRequest<GapAnalysisResponse>(
    `/gap-analysis?newProblemId=${newProblemId}&historicalProblemId=${historicalProblemId}`,
    { method: "GET" }
  );
}