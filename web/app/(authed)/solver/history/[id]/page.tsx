"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle2, Calendar, FileText, Paperclip, Download, AlertCircle, Network, Bot, UserMinus } from "lucide-react";
import { getAttemptDetails } from "../../dashboard/api/dashboard";
import type { AttemptDetail } from "@/types/attempt";

const DetailSkeleton = () => (
  <div className="min-h-screen bg-slate-50 p-6 md:p-8 animate-in fade-in duration-300">
    <div className="max-w-5xl mx-auto w-full">
      <div className="w-32 h-5 bg-slate-200 rounded-md animate-pulse mb-8" />
      <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div className="w-2/3 h-8 bg-slate-200 rounded-lg animate-pulse" />
            <div className="w-24 h-6 bg-slate-200 rounded-full animate-pulse" />
          </div>
          <div className="w-1/2 h-4 bg-slate-200 rounded-md animate-pulse" />
        </div>
        <div className="p-6 md:p-8 space-y-4">
          <div className="w-48 h-4 bg-slate-200 rounded-md animate-pulse mb-4" />
          <div className="w-full h-32 bg-slate-100 rounded-xl animate-pulse" />
          <div className="w-full flex justify-end mt-8 pt-6 border-t border-slate-100">
             <div className="w-48 h-10 bg-slate-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default function HistoryViewPage() {
  const params = useParams();
  const attemptId = params.id as string;
  
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAttemptDetails(attemptId)
      .then(setAttempt)
      .catch((err) => setError(err.message || "Failed to load history details"))
      .finally(() => setLoading(false));
  }, [attemptId]);

  if (loading) return <DetailSkeleton />;
  if (error || !attempt) return <div className="min-h-screen bg-slate-50 p-8 text-center text-rose-600 font-bold">{error || "Record not found"}</div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-8 animate-in fade-in duration-300">
      <div className="max-w-5xl mx-auto w-full">
        <Link 
          href="/solver/dashboard?tab=workspace" 
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-accent mb-8 transition-all active:scale-[0.98] cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Workspace
        </Link>

        <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">{attempt.problemTitle}</h1>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide shrink-0 ${
                attempt.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}>
                {attempt.status === "COMPLETED" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
                {attempt.status.replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-slate-600 font-medium flex flex-wrap items-center gap-4">
              <span><strong className="text-slate-900">Subtask:</strong> {attempt.targetSubtaskTitle || "Full Problem"}</span>
              <span className="flex items-center gap-1.5 text-slate-500 text-sm">
                <Calendar className="w-4 h-4" /> Concluded {new Date(attempt.completedAt).toLocaleDateString()}
              </span>
            </p>
          </div>

          <div className="p-6 md:p-8">

         {/* 🚀 ADDED: TERMINATION REASON FEEDBACK BLOCK */}
            {attempt.status === "TERMINATED" && attempt.terminationReason && (
              <div className="mb-8 p-5 md:p-6 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  {attempt.terminationReason.startsWith("Automatically terminated:") ? (
                    <><Bot className="w-4 h-4" /> System Auto-Termination</>
                  ) : (
                    <><UserMinus className="w-4 h-4" /> Terminated by Seeker</>
                  )}
                </h4>
                <div className="text-sm text-rose-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {attempt.terminationReason}
                </div>
              </div>
            )}

            {attempt.status === "REJECTED" && attempt.rejectionReason && (
              <div className="mb-8 p-5 md:p-6 bg-rose-50 border border-rose-200 rounded-xl shadow-sm">
                <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Rejection Feedback
                </h4>
                <div className="text-sm text-rose-900 font-medium whitespace-pre-wrap leading-relaxed">
                  {attempt.rejectionReason}
                </div>
              </div>
            )}

            {attempt.deltaDescription && (
              <div className="mb-8 p-5 md:p-6 bg-emerald-50 border border-emerald-100 rounded-xl">
                <h4 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-2">
                  What changed from the parent solution
                </h4>
                <p className="text-sm text-slate-700 italic font-medium leading-relaxed whitespace-pre-wrap">
                  "{attempt.deltaDescription}"
                </p>
              </div>
            )}

            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Resolution Summary</h3>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
              {attempt.summary}
            </div>

            {attempt.attachedFiles && attempt.attachedFiles.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Attached Documents
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {attempt.attachedFiles.map((url, idx) => (
                    <a 
                      key={idx} 
                      href={url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl hover:border-accent hover:shadow-md active:scale-[0.98] cursor-pointer transition-all group"
                    >
                      <span className="text-sm font-bold text-slate-700 truncate group-hover:text-accent transition-colors">
                        Attachment {idx + 1}
                      </span>
                      <Download className="w-4 h-4 text-slate-400 group-hover:text-accent transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap justify-end gap-3">
              <Link 
                href={`/solver/problem/${attempt.problemId}?tab=tree&highlight=${attempt.id}`} 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:shadow-sm rounded-lg text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                <Network className="w-4 h-4" /> View in Solution Tree
              </Link>
              <Link 
                href={`/solver/problem/${attempt.problemId}`} 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white hover:bg-accent/90 shadow-sm rounded-lg text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
              >
                View Original Problem <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}