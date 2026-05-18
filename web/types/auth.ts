export type UserRole = "SOLVER" | "SEEKER" | "ADMIN";

export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  institution?: string;
  degreeProgram?: string;
}

// Common registration fields
export interface BaseRegisterPayload {
  email: string;
  password: string;
}

// Solver-specific registration
export interface SolverRegisterPayload extends BaseRegisterPayload {
  firstName: string;
  lastName: string;
  institution: string;
  degreeProgram: string;
}

// Seeker-specific registration
export interface SeekerRegisterPayload extends BaseRegisterPayload {
  organizationName: string;
  contactPerson: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ErrorResponse {
  error?: string;
  message?: string;
}
