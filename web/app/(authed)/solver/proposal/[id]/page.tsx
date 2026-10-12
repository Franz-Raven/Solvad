"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Hourglass, Calendar } from "lucide-react";
import { getClaimDetails } from "../../dashboard/api/dashboard";
import type { ClaimDetail } from "@/types/attempt";

export default function ProposalViewPage() {
  const params = useParams();
  const claimId = params.id as string;
  
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getClaimDetails(claimId)
      .then(setClaim)
      .catch((err) => setError(err.message || "Failed to load proposal details"))
      .finally(() => setLoading(false));
  }, [claimId]);

  if (loading) return <div className="min-h-screen bg-slate-50 p-8 flex justify-center items-center"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"/></div>;
  if (error || !claim) return <div className="min-h-screen bg-slate-50 p-8 text-center text-rose-600 font-bold">{error || "Proposal not found"}</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-8 animate-in fade-in duration-300">
      <div className="max-w-4xl mx-auto">
        <Link href="/solver/dashboard?tab=workspace" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-accent mb-8 transition-colors active:scale-[0.98] cursor-pointer">
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{claim.problemTitle}</h1>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0">
                <Hourglass className="w-3.5 h-3.5" /> {claim.status.replace("_", " ")}
              </span>
            </div>
            <p className="text-slate-600 font-medium flex flex-wrap items-center gap-4">
              <span><strong className="text-slate-900">Subtask:</strong> {claim.targetSubtaskTitle || "Full Problem"}</span>
              <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                <Calendar className="w-4 h-4" /> Applied {new Date(claim.submittedAt).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="p-6 md:p-8">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Your Submitted Proposal</h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {claim.proposalText}
            </div>
            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
              <Link href={`/solver/problem/${claim.problemId}`} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:text-accent hover:border-accent hover:bg-slate-50 rounded-lg text-sm font-bold transition-all shadow-sm active:scale-[0.98] cursor-pointer">
                View Original Problem <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}