import { apiRequest } from "@/lib/api";
import type {
  AuthResponse,
  LoginPayload,
  SeekerRegisterPayload,
  SolverProfilePayload,
} from "@/types/auth";

export async function startSolverRegistration(
  data: LoginPayload,
): Promise<void> {
  await apiRequest<string>("/auth/register/start", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function registerSeeker(data: SeekerRegisterPayload) {
  return apiRequest<AuthResponse>("/auth/register/seeker", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function verifyEmailCode(token: string): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/verify", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function resendVerificationCode(email: string) {
  return apiRequest<string>(
    `/auth/resend-verification?email=${encodeURIComponent(email)}`,
    { method: "POST" },
  );
}

export async function completeSolverProfile(
  token: string,
  data: SolverProfilePayload,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/register/solver/profile", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
}

export async function completeGoogleRegistration(
  token: string,
  data: SolverProfilePayload,
): Promise<AuthResponse> {
  return apiRequest<AuthResponse>("/auth/google/complete", {
    method: "POST",
    body: JSON.stringify({ token, ...data }),
  });
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
