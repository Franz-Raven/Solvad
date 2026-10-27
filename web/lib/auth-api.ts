import { apiRequest } from "@/lib/api";
import type { GoogleAuthResult } from "@/types/auth";

export async function authenticateWithGoogle(
  credential: string,
): Promise<GoogleAuthResult> {
  return apiRequest<GoogleAuthResult>("/auth/google", {
    method: "POST",
    body: JSON.stringify({ token: credential }),
  });
}
