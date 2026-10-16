export interface SubtaskSubmissionResponse {
  id: string;
  subtaskId: string;
  subtaskTitle: string;
  subtaskDepartmentFocus: string;
  description: string;
  fileUrls: string[];
  status: "DRAFT" | "SUBMITTED";
  createdAt: string;
  updatedAt: string;
  submittedAt: string | null;
  deltaDescription?: string;
}

export interface SolutionAttemptResponse {
  id: string;
  problemId: string;
  problemTitle: string;
  solverId: string;
  solverFirstName: string;
  solverLastName: string;
  institution: string;
  profilePictureUrl?: string;
  parentSubmissions?: SubtaskSubmissionResponse[];
  degreeProgram: string;
  status: string;
  submissions: SubtaskSubmissionResponse[];
  claimedAt: string;
  updatedAt: string;
  completedAt?: string;
  parentAttemptId?: string | null;
  parentAttemptName?: string | null;
  targetSubtaskId?: string | null;      // ADD
  targetSubtaskTitle?: string | null;   // ADD
  parentSolverName?: string | null;
  parentDescription?: string | null;
  parentFileUrls?: string[];

  // 🚀 NEW FIELDS
  seekerName?: string;
  seekerProfileUrl?: string;
}

export interface TreeAttemptNode extends SolutionAttemptResponse {
  children: TreeAttemptNode[];
}

// ── Audit log ─────────────────────────────────────────────────────────────────

export type AuditEventType =
  | "PROBLEM_CREATED"
  | "STATUS_CHANGED"
  | "ATTEMPT_CLAIMED"
  | "ATTEMPT_FORKED"
  | "SUBTASK_SUBMITTED"
  | "SUBTASK_DRAFT_SAVED"
  | "ATTEMPT_ABANDONED"
  | "ATTEMPT_COMPLETED"
  | "FILE_UPLOADED"
  | "PROPOSAL_SUBMITTED" // <-- ADDED
  | "PROPOSAL_APPROVED"  // <-- ADDED
  | "PROPOSAL_REJECTED"  // <-- ADDED
  | "CAPACITY_REACHED"   // <-- ADDED
  | "PROBLEM_UPDATED";   // <-- ADDED

export interface AuditLogEntry {
  id: string;
  problemId: string;
  actorId: string | null;
  actorName: string;
  actorRole: "SEEKER" | "SOLVER" | "SYSTEM";
  eventType: AuditEventType;
  delta: string;
  timestamp: string;
}

export interface ProposalRequest {
  proposedApproach: string;
  parentAttemptId?: string;
  supportingDocuments?: string[];
}

export interface ClaimRequestResponse {
  id: string;
  problem: { id: string };
  solver: { id: string; firstName: string; lastName: string; institution?: string; profilePictureUrl?: string;};
  proposedApproach: string;
  supportingDocuments?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  createdAt: string;
  targetSubtaskId?: string;    // ADD
  targetSubtaskTitle?: string; // ADD
  parentAttemptId?: string;
}


// 🚀 New lightweight summary for the workspace
export interface SolutionAttemptSummary {
  id: string;
  problemId: string;
  problemTitle: string;
  solverFirstName: string;
  solverLastName: string;
  profilePictureUrl?: string;
  solverInstitution: string;
  solverDegreeProgram: string;
  status: string;
  submissionCount: number; // Replaces the array
  claimedAt: string;
  updatedAt: string;
  completedAt?: string | null;
  parentAttemptId?: string | null;
  parentSolverName?: string | null;
  targetSubtaskId?: string;
  targetSubtaskTitle?: string;

  seekerName?: string;
  seekerProfileUrl?: string;
}

export interface PaginatedAttemptsResponse {
  attempts: SolutionAttemptSummary[]; // 🚀 Update this array
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export interface ClaimSummary {
  id: string;
  problemId: string;
  problemTitle: string;
  targetSubtaskId?: string;
  targetSubtaskTitle?: string;
  status: string;
  submittedAt: string;
}

export interface PaginatedClaimsResponse {
  claims: ClaimSummary[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

//proposal
export interface ClaimDetail {
  id: string;
  problemId: string;
  problemTitle: string;
  targetSubtaskTitle?: string;
  status: string;
  submittedAt: string;
  proposalText: string;
  supportingDocuments?: string | null;
}

//history
export interface AttemptDetail {
  id: string;
  problemId: string;
  problemTitle: string;
  targetSubtaskTitle?: string;
  status: string;
  completedAt: string;
  summary: string;
  attachedFiles?: string[]; // 🚀 ADD THIS LINE
}

export interface AttemptNodeSummary {
  id: string;
  parentId: string | null;
  solverName: string;
  subtaskTitle: string;
  status: string;
}

// 🚀 The new lightweight summary type for the table
export interface ClaimSummaryResponse {
  id: string;
  solver: { firstName: string; lastName: string; institution?: string; profilePictureUrl?: string; };
  targetSubtaskId?: string;
  parentAttemptId?: string;
  status: string;
  createdAt: string;
  fileCount: number;
}