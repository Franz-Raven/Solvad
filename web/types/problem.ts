export interface SubProblem {
  id: string;
  title: string;
  departmentFocus: string;
  description: string;
}

export interface ProblemPayload {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  requiredCourse: string;
}

export interface GenerateScopeRequest {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  requiredCourse: string;
}

export interface GenerateScopeResponse {
  generatedSubtasks: SubProblem[];
}

export interface ProblemRequest {
  title: string;
  backgroundContext: string;
  primaryStatement: string;
  objectives: string;
  constraints: string;
  requiredCourse: string;
  subtasks: {
    title: string;
    departmentFocus: string;
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
  requiredCourse: string;
  status: string;
  seekerId: string;
  seekerOrganization: string;
  createdAt: string;
  subtasks: SubProblem[];
}
