"use client";

import { GapAnalysisResponse } from "@/lib/api/gap-analysis";
import {
  FileText,
  Brain,
  ListChecks,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

function cleanMarkdown(text: string): string {
  if (!text) return text;
  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
}

interface GapAnalysisViewProps {
  data: GapAnalysisResponse;
}

export default function GapAnalysisView({ data }: GapAnalysisViewProps) {
  const isUnique = data.recommendation.toLowerCase().includes("yes");

  return (
    <div className="space-y-6">
      <div className="bg-linear-to-r from-accent/10 to-primary-foreground/5 rounded-xl p-6 border border-accent/20">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/20 rounded-lg">
            <FileText className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Gap Analysis Report</h3>
            <p className="text-sm text-gray-600 mt-0.5">
              Comparative analysis between your problem and historical capstone
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <CardWithIcon
        icon={Brain}
        title="Executive Summary"
        iconColor="text-accent"
      >
        <p className="text-gray-700 leading-relaxed">{cleanMarkdown(data.executiveSummary)}</p>
      </CardWithIcon>

      <ListCard
        icon={ListChecks}
        title="Feature Differences"
        items={data.featureDifferences}
      />

      <ListCard
        icon={TrendingUp}
        title="Technical Deviations"
        items={data.technicalDeviations}
      />

      <ListCard
        icon={Lightbulb}
        title="Unique Contributions"
        items={data.uniqueContributions}
      />

      {/* Recommendation Card with dynamic styling */}
      <div
        className={`rounded-xl border-l-4 shadow-md overflow-hidden ${
          isUnique
            ? "border-green-500 bg-linear-to-r from-green-50 to-white"
            : "border-yellow-500 bg-linear-to-r from-yellow-50 to-white"
        }`}
      >
        <div className="p-6">
          <div className="flex items-start gap-3">
            <div className="shrink-0">
              {isUnique ? (
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              ) : (
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              )}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-1">Recommendation</h4>
              <p className="text-gray-700">{cleanMarkdown(data.recommendation)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// card
function CardWithIcon({
  icon: Icon,
  title,
  iconColor = "text-accent",
  children,
}: {
  icon: React.ElementType;
  title: string;
  iconColor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3 flex items-center gap-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// list-based sections
function ListCard({
  icon: Icon,
  title,
  items,
}: {
  icon: React.ElementType;
  title: string;
  items: string[];
}) {
  if (!items.length) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3 flex items-center gap-2">
          <Icon className="w-5 h-5 text-accent" />
          <h4 className="font-semibold text-gray-900">{title}</h4>
        </div>
        <div className="p-6 text-gray-500 italic">No items identified</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-3 flex items-center gap-2">
        <Icon className="w-5 h-5 text-accent" />
        <h4 className="font-semibold text-gray-900">{title}</h4>
      </div>
      <div className="p-6">
        <ul className="space-y-3">
          {items.map((item, idx) => (
            <li key={idx} className="flex gap-2 text-gray-700">
              <span className="text-accent font-bold mt-0.5">•</span>
              <span>{cleanMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}