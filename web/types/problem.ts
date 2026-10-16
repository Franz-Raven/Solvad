export interface SubProblem {
  id: string;
  title: string;
  departmentFocus: string;
  sdgFocus?: string;
  description: string;
  attachments?: AttachmentRequirement[];
  maxConcurrentSolvers?: number;
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
  attachments?: File[];
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

export interface AttachmentRequirement {
  id: string; 
  attachmentTitle: string;
  attachmentType: string; 
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
    attachments: Omit<AttachmentRequirement, 'id'>[];
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
  sdgFocus: string;
  status: string;
  seekerId: string;
  
  // 🚀 FIXED: Matches your Java backend's @JsonProperty("organizationName")
  organizationName: string; 
  
  createdAt: string;
  subtasks: SubtaskResponse[];
  tags: string[];
  problemDocumentUrl?: string;
  maxConcurrentSolvers?: number;
  
  seekerProfileUrl?: string;
  contactPerson?: string;
  contactNumber?: string;
  seekerEmail?: string;
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

export interface ProblemSummary {
  id: string;
  title: string;
  organizationName: string;
  preferredProgram: string;
  status: string;
  subtaskCount: number;
  createdAt: string;
  courseMatch: boolean;
  matchScore: number;
  sdgFocus: string;
  seekerProfileUrl?: string; // Add this line
}

export interface PaginatedProblemsResponse {
  problems: ProblemSummary[]; // Uses unified summary
  currentPage: number;
  totalPages: number;
  totalElements: number;
  pageSize: number;
}

export interface SeekerProblemListResponse {
  problems: ProblemSummary[]; // Uses unified summary
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
  attachments?: AttachmentRequirement[];
  maxConcurrentSolvers?: number;
}

export interface PaginatedNotificationsResponse {
  notifications: SeekerNotification[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
  size: number;
}