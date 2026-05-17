export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  role: "SOLVER" | "SEEKER" | "ADMIN";
}

export interface RegisterPayload {
  email: string;
  password: string;
  role: "SOLVER" | "SEEKER" | "ADMIN";
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
