import { apiRequest } from "@/lib/api";
import type { AuthResponse, LoginPayload } from "@/types/auth";

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}