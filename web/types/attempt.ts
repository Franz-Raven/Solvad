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
  solverInstitution: string;
  solverDegreeProgram: string;
  status: "ACTIVE" | "ABANDONED" | "COMPLETED" | "TERMINATED";
  submissions: SubtaskSubmissionResponse[];
  claimedAt: string;
  updatedAt: string;
  completedAt: string | null;
  parentAttemptId?: string;
  parentSolverName?: string;
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
  | "FILE_UPLOADED";

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