export interface SubProblem {
  id: string;
  title: string;
  departmentFocus: string;
  sdgFocus?: string;
  description: string;
}

export interface ProblemPayload {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  preferredProgram: string;
}

export interface GenerateScopeRequest {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  preferredProgram: string;
  attachments?: File[]; // Optional file attachments
}

export interface EnhancedProblem {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string[];
  constraints: string[];
  sdgFocus?: string;
}

export interface GenerateScopeResponse {
  enhancedProblem: EnhancedProblem;
  generatedSubtasks: SubProblem[];
}

export interface ProblemRequest {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  preferredProgram: string;
  sdgFocus?: string;
  subtasks: {
    title: string;
    departmentFocus: string;
    sdgFocus?: string;
    description: string;
  }[];
}

export interface ProblemResponse {
  id: string;
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  preferredProgram: string;
  sdgFocus?: string;
  status: string;
  seekerId: string;
  organizationName: string;
  createdAt: string;
  problemDocumentUrl?: string;
  subtasks: SubProblem[];
  tags?: string[];
  matchScore?: number;
  courseMatch?: boolean;
  maxConcurrentSolvers?: number; 
  
}

export interface DiscoveryDashboardResponse {
  recommended: ProblemResponse[];
  problems: ProblemResponse[];
  availableTags: string[];
  solverCourse: string;
  solverSkills: string;
}

export interface SeekerNotification {
  id: string;
  problemId: string;
  problemTitle: string;
  eventType: string;
  message: string;
  actorName: string;
  timestamp: string;
}

export interface PaginatedProblemsResponse {
  problems: ProblemResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

export interface ProblemSummaryResponse {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  subtaskCount: number;
  preferredProgram: string;
  sdgFocus?: string;
  organizationName: string;
  tags?: string[];
}

export interface SeekerProblemListResponse {
  problems: ProblemSummaryResponse[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

export interface SubtaskResponse {
  id: string;
  title: string;
  departmentFocus: string;
  sdgFocus?: string;
  description: string;
}

