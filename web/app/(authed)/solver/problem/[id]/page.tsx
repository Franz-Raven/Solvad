"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { 
  getProblemById, 
  getAllAttempts, 
  getMyAttempt, 
  getMyProposalStatus 
} from "./api/problem";

import type { ProblemResponse } from "@/types/problem";
import type { SolutionAttemptResponse } from "@/types/attempt";

// 🚀 OPTIMIZATION: Lazy Load all tab components locally. 
// The browser will NOT download the code for these until the user clicks the specific tab.
const BlueprintTab = dynamic(() => import("./components/BlueprintTab").then(mod => mod.BlueprintTab), {
  loading: () => <div className="p-12 text-center text-gray-500 animate-pulse">Loading Blueprint...</div>
});

const SubtasksTab = dynamic(() => import("./components/SubtasksTab").then(mod => mod.SubtasksTab), {
  loading: () => <div className="p-12 text-center text-gray-500 animate-pulse">Loading Subtasks...</div>
});

const SolutionTreeTab = dynamic(() => import("./components/SolutionTreeTab").then(mod => mod.SolutionTreeTab), {
  loading: () => <div className="p-12 text-center text-gray-500 animate-pulse">Loading Solution Tree...</div>
});

const AuditTimelineTab = dynamic(() => import("./components/AuditTimelineTab").then(mod => mod.AuditTimelineTab), {
  loading: () => <div className="p-12 text-center text-gray-500 animate-pulse">Loading History...</div>
});

// Modals are perfect for lazy loading and disabling SSR since they are heavily interactive
const SubmitProposalModal = dynamic(() => import("./components/SubmitProposalModal"), {
  ssr: false,
});

type TabType = "blueprint" | "subtasks" | "tree" | "history";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-blue-500 text-white",
  CLAIMED: "bg-purple-500 text-white",
  IN_PROGRESS: "bg-yellow-500 text-white",
  SOLVED_OPEN_FOR_IMPROVEMENT: "bg-green-500 text-white",
  COMPLETED: "bg-gray-800 text-white",
  CLOSED: "bg-gray-500 text-white",
  TERMINATED: "bg-red-500 text-white",
};

export default function SolverProblemDetailPage() {
  const params = useParams();
  const problemId = params.id as string;

  const [problem, setProblem] = useState<ProblemResponse | null>(null);
  const [myAttempt, setMyAttempt] = useState<SolutionAttemptResponse | null>(null);
  const [attempts, setAttempts] = useState<SolutionAttemptResponse[]>([]);
  const [myProposalStatus, setMyProposalStatus] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<TabType>("blueprint");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposal Modal State
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [forkParentId, setForkParentId] = useState<string | undefined>(undefined);
  const [proposalSubtaskId, setProposalSubtaskId] = useState<string | undefined>(undefined);

  useEffect(() => {
    loadData();
  }, [problemId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 🚀 OPTIMIZATION: Fire all 4 network requests simultaneously!
      const [
        problemResult,
        myAttemptResult,
        allAttemptsResult,
        proposalStatusResult
      ] = await Promise.allSettled([
        getProblemById(problemId),
        getMyAttempt(problemId),
        getAllAttempts(problemId),
        getMyProposalStatus(problemId)
      ]);

      // 1. Handle Problem Data (Required - throw error if this fails)
      if (problemResult.status === "fulfilled") {
        setProblem(problemResult.value);
      } else {
        throw new Error("Failed to load problem details.");
      }

      // 2. Handle Optional Data (Fail gracefully by setting to null/empty array)
      setMyAttempt(myAttemptResult.status === "fulfilled" ? myAttemptResult.value : null);
      setAttempts(allAttemptsResult.status === "fulfilled" ? allAttemptsResult.value : []);
      setMyProposalStatus(proposalStatusResult.status === "fulfilled" ? proposalStatusResult.value.status : null);

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
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700">
            {error || "Problem not found"}
          </div>
          <Link
            href="/solver/dashboard"
            className="mt-4 inline-block text-accent hover:text-secondary"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isAlreadyClaimed = myAttempt?.status === "ACTIVE";
  const isCompleted = myAttempt?.status === "COMPLETED";
  
  // 1. Check how many solvers are currently active across ALL subtasks
  const activeSolversCount = attempts.filter((a) => a.status === "ACTIVE").length;
  
  // 2. The backend enforces limit PER SUBTASK, so total problem capacity is (limit * subtask count)
  const totalProblemCapacity = (problem.maxConcurrentSolvers ?? 3) * (problem.subtasks?.length || 1);
  const isAtCapacity = activeSolversCount >= totalProblemCapacity;

  // 3. Match backend logic: Allow claims if OPEN, IN_PROGRESS, or CLAIMED
  const canClaimFresh = ["OPEN", "IN_PROGRESS", "CLAIMED"].includes(problem.status) && !isAtCapacity;

  const isUnavailable =
    !isAlreadyClaimed &&
    !canClaimFresh &&
    problem.status !== "SOLVED_OPEN_FOR_IMPROVEMENT";

  const canPropose =
    !isAlreadyClaimed &&
    !isUnavailable &&
    myProposalStatus !== "PENDING";
  
  const tabs: { id: TabType; label: string }[] = [
    { id: "blueprint", label: "Problem Blueprint" },
    { id: "subtasks", label: "Sub-problems" },
    {
      id: "tree",
      label: `Solution Tree${attempts.length > 0 ? ` (${attempts.length})` : ""}`,
    },
    { id: "history", label: "History" },
  ];

  // Render the correct action button based on all possible states
  const renderHeaderAction = () => {
    if (isAlreadyClaimed) {
      return (
        <Link
            href={`/solver/workspace/${problemId}`}
            className="px-6 py-2.5 bg-secondary..."
          >
            Continue Working →
        </Link>
      );
    }

    if (myProposalStatus === "PENDING") {
      return (
        <span className="px-5 py-2.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg font-medium inline-flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
          Proposal Pending Review
        </span>
      );
    }

    if (myProposalStatus === "APPROVED") {
      return (
        <span className="px-5 py-2.5 bg-green-50 text-green-700 border border-green-200 rounded-lg font-medium inline-flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
          Proposal Approved — Workspace Loading
        </span>
      );
    }

    if (canClaimFresh) {
      return (
        <button
          onClick={() => setActiveTab("tree")}
          className="px-6 py-2.5 bg-secondary hover:bg-accent text-white rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
        >
          Submit Solution Proposal
        </button>
      );
    }

    if (problem.status === "SOLVED_OPEN_FOR_IMPROVEMENT") {
      return (
        <button
          type="button"
          onClick={() => setActiveTab("tree")}
          className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
        >
          Build Upon (Solution Tree)
        </button>
      );
    }

    if (isUnavailable) {
      return (
        <span className="px-6 py-2.5 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed inline-block">
          {isAtCapacity ? "Capacity Reached" : "Not Available"}
        </span>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent/20 via-background to-accent/10">
      {/* ── Proposal Flow Modal ── */}
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

      {/* ── Sticky header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-60 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <Link
            href="/solver/dashboard"
            className="text-sm text-gray-600 hover:text-accent mb-4 inline-flex items-center"
          >
            <svg
              className="w-4 h-4 mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </Link>

          <div className="flex items-start justify-between mt-2">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight flex-1 min-w-0 pr-4">
              {problem.title}
            </h1>
            <div className="flex-shrink-0">{renderHeaderAction()}</div>
          </div>

          <div className="flex items-center gap-3 flex-wrap mt-4">
            <span
              className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold ${
                STATUS_COLORS[problem.status] || STATUS_COLORS.OPEN
              }`}
            >
              {problem.status.replace(/_/g, " ")}
            </span>
            <span className="inline-flex items-center px-3 py-1.5 bg-accent/10 text-accent rounded-full text-sm font-medium border border-accent/20">
              {problem.preferredProgram}
            </span>
            <span className="inline-flex items-center text-sm text-gray-600 font-medium">
              {problem.subtasks.length} Sub-tasks
            </span>
            <span className="inline-flex items-center text-sm text-gray-600">
              {problem.organizationName}
            </span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8">
          <div className="flex gap-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-accent text-accent"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Page body ── */}
      <div className="max-w-7xl mx-auto px-8 py-8 space-y-6">
        {/* Active claim banner */}
        {isAlreadyClaimed && (
          <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
              <p className="text-sm font-medium text-secondary">
                You have an active claim on this problem.
              </p>
            </div>
            <Link
              href={`/solver/problem/${problemId}/work`}
              className="text-sm font-semibold text-secondary hover:text-accent transition-colors"
            >
              Go to workspace →
            </Link>
          </div>
        )}

        {/* Pending proposal banner */}
        {!isAlreadyClaimed && myProposalStatus === "PENDING" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse flex-shrink-0" />
            <p className="text-sm font-medium text-amber-800">
              Your proposal has been submitted and is awaiting review by the
              Seeker. You will be notified when it is approved.
            </p>
          </div>
        )}

        {/* 🚀 These tabs will now ONLY download when they evaluate to true! */}
        {activeTab === "blueprint" && <BlueprintTab problem={problem} />}

        {activeTab === "subtasks" && (
          <SubtasksTab
            problem={problem}
            attempts={attempts} 
            canPropose={canPropose}
            onPropose={(subtaskId: string) => openProposalModal(subtaskId)}
          />
        )}

       {activeTab === "tree" && (
            <SolutionTreeTab
            attempts={attempts}
            isAlreadyClaimed={isAlreadyClaimed}
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
  );
}