import { SolverMetrics } from "./attempt";

export interface SolverProfile {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  institution: string;
  degreeProgram: string;
  skills?: string;
  profileUrl?: string;
  metrics?: SolverMetrics;
}

export interface UpdateSolverProfilePayload {
  firstName: string;
  lastName: string;
  institution: string;
  degreeProgram: string;
  skills?: string;
}
