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

export interface RegisterPayload {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  institution: string;
  degreeProgram: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ErrorResponse {
  error?: string;
  message?: string;
}
