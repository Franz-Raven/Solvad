"use client";

interface SimilarityWarningCardProps {
  HistoricalProblemId: string;
  HistoricalTitle: string;
  SimilarityPercentage: number;
}

export default function SimilarityWarningCard({
  HistoricalProblemId,
  HistoricalTitle,
  SimilarityPercentage,
}: SimilarityWarningCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-flex items-center px-3 py-1 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              {Math.round(SimilarityPercentage)}% Match
            </span>
            {SimilarityPercentage >= 95 && (
              <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                Potential Duplicate
              </span>
            )}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            {HistoricalTitle}
          </h4>
        </div>
        <button
          onClick={() =>
            window.open(`/seeker/problem/${HistoricalProblemId}`, "_blank")
          }
          className="px-4 py-2 bg-accent hover:bg-secondary text-white font-semibold rounded-lg transition-colors flex-shrink-0 ml-4"
        >
          View Details
        </button>
      </div>
    </div>
  );
}
