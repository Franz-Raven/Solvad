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
  status: "ACTIVE" | "ABANDONED" | "COMPLETED";
  submissions: SubtaskSubmissionResponse[];
  claimedAt: string;
  updatedAt: string;
  completedAt: string | null;
}