import { apiRequest } from "@/lib/api";
import type { AuthResponse, SeekerRegisterPayload } from "@/types/auth";

export async function registerSeeker(data: SeekerRegisterPayload) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 🚀 Point to the new /admin route instead of /auth
  return apiRequest<AuthResponse>("/admin/register/seeker", {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  });
}