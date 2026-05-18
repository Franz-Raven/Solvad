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
