import { apiRequest } from "@/lib/api";
import type { AuthResponse, SeekerRegisterPayload } from "@/types/auth";

export async function registerSeeker(data: SeekerRegisterPayload) {
  // Explicitly grab the token to bypass any /auth exclusions in the base apiRequest wrapper
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  return apiRequest<AuthResponse>("/auth/register/seeker", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}