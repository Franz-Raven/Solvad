import { apiRequest } from "../../../../lib/api";
import { SolverProfile, UpdateSolverProfilePayload } from "@/types/solver";

/**
 * Get the currently authenticated solver's profile
 */
export async function getMyProfile(): Promise<SolverProfile> {
  return apiRequest<SolverProfile>("/solver-profiles/me", {
    method: "GET",
  });
}

/**
 * Get all solver profiles (admin only)
 */
export async function getAllProfiles(): Promise<SolverProfile[]> {
  return apiRequest<SolverProfile[]>("/solver-profiles", {
    method: "GET",
  });
}

/**
 * Get a specific solver profile by user ID
 */
export async function getProfileByUserId(userId: string): Promise<SolverProfile> {
  return apiRequest<SolverProfile>(`/solver-profiles/${userId}`, {
    method: "GET",
  });
}

/**
 * Update the currently authenticated solver's profile
 */
export async function updateMyProfile(
  data: UpdateSolverProfilePayload
): Promise<SolverProfile> {
  return apiRequest<SolverProfile>("/solver-profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Update a specific solver profile by user ID (admin only)
 */
export async function updateProfile(
  userId: string,
  data: UpdateSolverProfilePayload
): Promise<SolverProfile> {
  return apiRequest<SolverProfile>(`/solver-profiles/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
