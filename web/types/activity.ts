// types/activity.ts

export type ActivityActionType =
  | "STATUS_CHANGE"
  | "FILE_UPLOAD"
  | "CLAIMED"
  | "SOLUTION_SUBMITTED"
  | "PROBLEM_CREATED"
  | "SUBTASK_UPDATED"
  | "DOCUMENT_DELETED";

export interface ActivityLedgerResponse {
  id: string;
  problemId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  actionType: ActivityActionType;
  description: string;
  metadata?: string;
  timestamp: string;
}

export interface DocumentUploadRequest {
  fileUrl: string;
  fileName: string;
}