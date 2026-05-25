export interface SimilarityMatch {
  HistoricalProblemId: string;
  HistoricalTitle: string;
  SimilarityPercentage: number;
}

export interface SimilarityResponse {
  hasDuplicates: boolean;
  similarProjects: SimilarityMatch[];
}