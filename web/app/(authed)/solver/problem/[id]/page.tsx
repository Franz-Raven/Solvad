"use client";

import { Suspense, useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ChevronLeft } from "lucide-react";
import { 
  getProblemById, 
  getMyAttempt, 
  getMyProposalStatus 
} from "./api/problem";
import { getMyActiveAttempts } from "../../dashboard/api/dashboard";

import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

const BlueprintTab = dynamic(() => import("./components/BlueprintTab").then((mod) => mod.BlueprintTab), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">
      <div className="w-48 h-8 bg-slate-200 rounded-lg mb-8" />
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="w-32 h-4 bg-slate-200 rounded mb-3" />
            <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  )
});

const SubtasksTab = dynamic(() => import("./components/SubtasksTab").then((mod) => mod.SubtasksTab), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">
      <div className="w-64 h-8 bg-slate-200 rounded-lg mb-8" />
      <div className="space-y-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-slate-50 border border-slate-100 rounded-2xl" />
        ))}
      </div>
    </div>
  )
});

const SolutionTreeTab = dynamic(() => import("./components/SolutionTreeTab").then((mod) => mod.SolutionTreeTab), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">
      <div className="w-64 h-8 bg-slate-200 rounded-lg mb-8" />
      <div className="h-[480px] bg-slate-50 border border-slate-100 rounded-2xl" />
    </div>
  )
});

const AuditTimelineTab = dynamic(() => import("./components/AuditTimelineTab").then((mod) => mod.AuditTimelineTab), {
  loading: () => (
    <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">
      <div className="w-48 h-8 bg-slate-200 rounded-lg mb-8" />
      <div className="h-16 bg-slate-50 border border-slate-100 rounded-xl mb-12" />
      <div className="space-y-6 pl-12 border-l-2 border-slate-100 ml-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl shadow-sm relative">
            <div className="absolute -left-16 top-4 w-8 h-8 rounded-full bg-slate-200" />
          </div>
        ))}
      </div>
    </div>
  )
});

const SubmitProposalModal = dynamic(() => import("./components/SubmitProposalModal"), {
  ssr: false,
});

type TabType = "blueprint" | "subtasks" | "tree" | "history";

const getBadgeStyle = (status: string) => {
  switch(status) {
    case "OPEN": return "bg-accent/10 text-accent border-accent/20";
    case "SOLVED_OPEN_FOR_IMPROVEMENT": 
    case "COMPLETED": return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "TERMINATED":
    case "CLOSED": return "bg-rose-50 text-rose-700 border-rose-200";
    default: return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

function SolverProblemDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const problemId = params.id as string;
  
  const tabParam = searchParams.get("tab") as TabType | null;
  const highlightParam = searchParams.get("highlight");

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [myAttempt, setMyAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [myProposalStatus, setMyProposalStatus] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>(tabParam || "blueprint");
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(highlightParam);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showProposalModal, setShowProposalModal] = useState(false);
  const [forkParentId, setForkParentId] = useState<string | undefined>(undefined);
  const [proposalSubtaskId, setProposalSubtaskId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [problemId]);

  useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
    if (highlightParam) setHighlightedNodeId(highlightParam);
  }, [tabParam, highlightParam]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        problemResult,
        proposalStatusResult
      ] = await Promise.allSettled([
        getProblemById(problemId),
        getMyProposalStatus(problemId)
      ]);

      if (problemResult.status === "fulfilled") {
        setProblem(problemResult.value);
      } else {
        throw new Error("Failed to load problem details.");
      }

      setMyProposalStatus(proposalStatusResult.status === "fulfilled" ? proposalStatusResult.value.status : null);

      let attemptData = null;
      try {
        attemptData = await getMyAttempt(problemId);
      } catch (e) {
        try {
          const allAttempts = await getMyActiveAttempts();
          attemptData = allAttempts.find(a => a.problemId === problemId) || null;
        } catch (err) {}
      }
      setMyAttempt(attemptData as SolutionAttemptResponse | null);

    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load problem");
    } finally {
      setLoading(false);
    }
  };

  const openProposalModal = (subtaskId: string, parentId?: string) => {
    setProposalSubtaskId(subtaskId);
    setForkParentId(parentId);
    setShowProposalModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-5">
            <div className="w-32 h-4 bg-slate-100 rounded animate-pulse mb-4" />
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="w-full md:w-3/4 h-8 md:h-10 bg-slate-100 rounded-lg animate-pulse" />
              <div className="w-full md:w-40 h-10 bg-slate-100 rounded-xl animate-pulse flex-shrink-0" />
            </div>
            <div className="flex items-center gap-3 mt-4 mb-4">
              <div className="w-16 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-48 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-24 h-6 bg-slate-100 rounded-md animate-pulse" />
              <div className="w-40 h-5 bg-slate-100 rounded-md animate-pulse ml-1" />
            </div>
            <div className="flex space-x-2 bg-slate-50 p-1 rounded-xl mt-4 w-fit animate-pulse border border-slate-100">
              <div className="w-36 h-9 bg-white rounded-lg border border-slate-200" />
              <div className="w-28 h-9 bg-slate-200/50 rounded-lg" />
              <div className="w-32 h-9 bg-slate-200/50 rounded-lg" />
              <div className="w-20 h-9 bg-slate-200/50 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.03)] border border-slate-100 p-6 md:p-8 animate-pulse">
            <div className="w-48 h-8 bg-slate-100 rounded-lg mb-8" />
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i}>
                  <div className="w-32 h-4 bg-slate-100 rounded mb-3" />
                  <div className="h-24 bg-slate-50 border border-slate-100 rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-slate-50/50 p-8 flex flex-col items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 max-w-lg w-full text-center shadow-sm">
          <h2 className="text-xl font-bold text-red-700 mb-2">Error Loading Problem</h2>
          <p className="text-sm font-medium text-red-600 mb-6">{error || "Problem not found"}</p>
          <Link href="/solver/dashboard" className="px-6 py-2.5 bg-white border border-red-200 text-red-700 font-bold rounded-lg hover:bg-red-100 transition-colors inline-block">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyClaimed = myAttempt?.status === "ACTIVE";
  const isPendingReview = myAttempt?.status === "PENDING_REVIEW";
  const isCompleted = myAttempt?.status === "COMPLETED";
  const canClaimFresh = ["OPEN", "IN_PROGRESS", "CLAIMED"].includes(problem.status);

  const isUnavailable =
    !isAlreadyClaimed &&
    !isPendingReview &&
    !canClaimFresh &&
    problem.status !== "SOLVED_OPEN_FOR_IMPROVEMENT";

  const canPropose =
    !isAlreadyClaimed &&
    !isPendingReview &&
    !isUnavailable &&
    myProposalStatus !== "PENDING";
  
  const tabs: { id: TabType; label: string }[] = [
    { id: "blueprint", label: "Problem Blueprint" },
    { id: "subtasks", label: "Sub-problems" },
    { id: "tree", label: "Solution Tree" },
    { id: "history", label: "History" },
  ];

  const renderHeaderAction = () => {
    if (isAlreadyClaimed) {
      return (
        <Link href={`/solver/workspace/${problemId}`} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white font-bold rounded-xl shadow-md transition-all w-full md:w-auto inline-flex items-center justify-center cursor-pointer">
            Continue Working →
        </Link>
      );
    }
    if (isPendingReview) {
      return (
        <Link href={`/solver/workspace/${problemId}`} className="px-6 py-2.5 bg-blue-50 text-blue-700 border border-blue-200 font-bold rounded-xl shadow-sm transition-all w-full md:w-auto inline-flex items-center justify-center cursor-pointer">
          <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0 mr-2" /> Solution Under Review
        </Link>
      );
    }
    if (myProposalStatus === "PENDING") {
      return (
        <span className="px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl font-bold inline-flex items-center justify-center w-full md:w-auto gap-2 text-sm uppercase tracking-wide">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" /> Proposal Pending
        </span>
      );
    }
    if (myProposalStatus === "APPROVED") {
      return (
        <span className="px-5 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold inline-flex items-center justify-center w-full md:w-auto gap-2 text-sm uppercase tracking-wide">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" /> Workspace Loading
        </span>
      );
    }
    if (canClaimFresh) {
      return (
        <button onClick={() => setActiveTab("tree")} className="px-6 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-xl font-bold transition-all shadow-md flex w-full md:w-auto items-center justify-center gap-2 cursor-pointer">
          Submit Proposal
        </button>
      );
    }
    if (problem.status === "SOLVED_OPEN_FOR_IMPROVEMENT") {
      return (
        <button type="button" onClick={() => setActiveTab("tree")} className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md w-full md:w-auto cursor-pointer">
          Build Upon (Solution Tree)
        </button>
      );
    }
    if (isUnavailable) {
      return (
        <span className="px-6 py-2.5 bg-slate-100 text-slate-400 rounded-xl font-bold border border-slate-200 cursor-not-allowed inline-flex items-center justify-center w-full md:w-auto uppercase tracking-wide text-sm">
          Not Available
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {showProposalModal && proposalSubtaskId && (
        <SubmitProposalModal
          problemId={problemId}
          subtaskId={proposalSubtaskId}
          parentAttemptId={forkParentId}
          onClose={() => setShowProposalModal(false)}
          onSuccess={() => {
            setShowProposalModal(false);
            setMyProposalStatus("PENDING");
            loadData();
          }}
        />
      )}

      <div className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm animate-in fade-in duration-500">
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-4 md:py-5">
          <Link href="/solver/dashboard" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors mb-3 inline-flex items-center gap-1.5 cursor-pointer">
            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight flex-1 min-w-0">
              {problem.title}
            </h1>
            <div className="flex-shrink-0 w-full md:w-auto">{renderHeaderAction()}</div>
          </div>

         <div className="flex items-center gap-3 flex-wrap mt-3">
            <span className={`text-[10px] sm:text-[11px] px-3 py-1 rounded-md font-bold border uppercase tracking-wider ${getBadgeStyle(problem.status)}`}>
              {problem.status.replace(/_/g, " ")}
            </span>
            <span className="text-[10px] sm:text-[11px] px-3 py-1 rounded-md font-bold border border-amber-200 bg-amber-50 text-amber-700 uppercase tracking-wider">
              {problem.preferredProgram}
            </span>
            <span className="text-[10px] sm:text-[11px] px-3 py-1 rounded-md font-bold border border-slate-200 bg-slate-50 text-slate-600 uppercase tracking-wider">
              {problem.subtasks.length} Sub-tasks
            </span>
            <span className="text-sm font-bold text-slate-500 ml-1">
              {problem.organizationName}
            </span>
          </div>

          <div className="flex space-x-1 bg-slate-50 p-1 rounded-xl mt-4 w-fit overflow-x-auto border border-slate-100">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id !== "tree") setHighlightedNodeId(null);
                }}
                className={`px-5 md:px-6 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-white text-accent shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-8 space-y-6">
        {isAlreadyClaimed && (
          <div className="bg-white border-l-4 border-accent shadow-sm rounded-r-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-accent rounded-full animate-pulse" />
              <p className="text-sm font-bold text-slate-800">You have an active claim on this problem.</p>
            </div>
            <Link href={`/solver/workspace/${problemId}`} className="text-sm font-bold text-accent hover:underline transition-all cursor-pointer">
              Go to workspace →
            </Link>
          </div>
        )}

        {isPendingReview && (
          <div className="bg-white border-l-4 border-blue-500 shadow-sm rounded-r-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
              <p className="text-sm font-bold text-slate-800">Your solution is currently under review by the Seeker.</p>
            </div>
            <Link href={`/solver/workspace/${problemId}`} className="text-sm font-bold text-blue-700 hover:underline transition-all cursor-pointer">
              View read-only workspace →
            </Link>
          </div>
        )}

        {!isAlreadyClaimed && !isPendingReview && myProposalStatus === "PENDING" && (
          <div className="bg-white border-l-4 border-amber-500 shadow-sm rounded-r-xl p-5 flex items-center gap-3 animate-in fade-in duration-300">
            <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
            <p className="text-sm font-bold text-slate-800">Your proposal has been submitted and is awaiting review.</p>
          </div>
        )}

        <div className="animate-in fade-in duration-500">
          {activeTab === "blueprint" && <BlueprintTab problem={problem} />}

          {activeTab === "subtasks" && (
            <SubtasksTab
              problem={problem}
              canPropose={canPropose}
              isPendingReview={isPendingReview}
              onPropose={(subtaskId: string) => openProposalModal(subtaskId)}
            />
          )}

          {activeTab === "tree" && (
            <SolutionTreeTab
              problemId={problem.id}
              highlightedAttemptId={highlightedNodeId}
              isAlreadyClaimed={isAlreadyClaimed}
              isPendingReview={isPendingReview}
              isCompleted={isCompleted}
              isUnavailable={isUnavailable}
              myProposalStatus={myProposalStatus}
              onForkRequest={(parentId: string, subtaskId: string) => openProposalModal(subtaskId, parentId)}
              onClaimNew={() => setActiveTab("subtasks")}
            />
          )}

          {activeTab === "history" && <AuditTimelineTab problemId={problemId} />}
        </div>
      </div>
    </div>
  );
}

export default function SolverProblemDetailPage() {
  return (
    <Suspense fallback={null}>
      <SolverProblemDetailContent />
    </Suspense>
  );
}