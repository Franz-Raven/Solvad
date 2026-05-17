import { apiRequest } from "@/lib/api";
import { AuthResponse, RegisterPayload, LoginPayload } from "@/types/auth";

export async function registerUser(data: RegisterPayload) {
  const result = await apiRequest<AuthResponse>("/auth/register", {
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
