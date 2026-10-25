import { apiRequest } from "@/lib/api";
import { 
  AuthResponse, 
  SolverRegisterPayload, 
  SeekerRegisterPayload, 
  LoginPayload 
} from "@/types/auth";

export async function registerSolver(data: SolverRegisterPayload) {
  const result = await apiRequest<AuthResponse>("/auth/register/solver", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}

export async function registerSeeker(data: SeekerRegisterPayload) {
  const result = await apiRequest<AuthResponse>("/auth/register/seeker", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}
export async function verifyEmailCode(token: string) {
  const result = await apiRequest<string>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
  return result;
}

export async function resendVerificationCode(email: string) {
  const result = await apiRequest<string>(`/auth/resend-verification?email=${encodeURIComponent(email)}`, {
    method: "POST",
  });
  return result;
}

export async function loginUser(data: LoginPayload) {
  const result = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result;
}

export async function logoutUser() {
  const result = await apiRequest<{ message: string }>("/auth/logout", {
    method: "POST",
  });
  
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
  
  return result;
}
