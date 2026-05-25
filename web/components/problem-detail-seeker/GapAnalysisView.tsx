"use client";

import { GapAnalysisResponse } from "@/lib/api/gap-analysis";


interface GapAnalysisViewProps {
  data: GapAnalysisResponse;
}

function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*/g, '')   // remove all ** (bold markers)
    .replace(/__/g, '')     // remove all __
    .replace(/\*/g, '')     // remove single * (italic)
    .replace(/`/g, '')      // remove backticks
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // convert links to text only
}

export default function GapAnalysisView({ data }: GapAnalysisViewProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">Gap Analysis Report</h3>

      <div className="bg-accent/5 rounded-lg p-5 border border-accent/20">
         <h4 className="font-semibold text-accent mb-2">Executive Summary</h4>
        <p className="text-gray-700">{cleanMarkdown(data.executiveSummary)}</p>

      </div>

      <Section title="Feature Differences" items={data.featureDifferences} />

      <Section title="Technical Deviations" items={data.technicalDeviations} />

      <Section title="Unique Contributions" items={data.uniqueContributions} />

      {/* Recommendation */}
      <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">Recommendation</h4>
        <p className="text-gray-700">{data.recommendation}</p>
      </div>
    </div>
  );
}

function Section({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-3">{title}</h4>
      <ul className="list-disc pl-5 space-y-1 text-gray-700">
        {items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
