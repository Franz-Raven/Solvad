export type NotificationType =
  | 'PROPOSAL_SUBMITTED'
  | 'PROPOSAL_APPROVED'
  | 'PROPOSAL_REJECTED';

// all IDs are UUID strings
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  message: string;
  problemId: string | null;
  claimRequestId: string | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UnreadCountResponse {
  count: number;
}