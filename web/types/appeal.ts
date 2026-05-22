export type AppealStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface Appeal {
  id: string;
  problemId: string;
  solverId: string;
  solverFirstName: string;
  solverLastName: string;
  solverInstitution: string;
  message: string;
  status: AppealStatus;
  createdAt: string;
  reviewedAt?: string;
  attemptId?: string;
}

export interface AppealsByStatus {
  pending: Appeal[];
  approved: Appeal[];
  rejected: Appeal[];
}
