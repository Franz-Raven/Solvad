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
