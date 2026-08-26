import { apiRequest } from "../../../../lib/api";
import { SeekerProfile, UpdateSeekerProfilePayload } from "../../../../types/seeker";

/**
 * Get the currently authenticated seeker's profile
 */
export async function getMyProfile(): Promise<SeekerProfile> {
  return apiRequest<SeekerProfile>("/seeker-profiles/me", {
    method: "GET",
  });
}

/**
 * Get all seeker profiles (admin only)
 */
export async function getAllProfiles(): Promise<SeekerProfile[]> {
  return apiRequest<SeekerProfile[]>("/seeker-profiles", {
    method: "GET",
  });
}

/**
 * Get a specific seeker profile by user ID
 */
export async function getProfileByUserId(userId: string): Promise<SeekerProfile> {
  return apiRequest<SeekerProfile>(`/seeker-profiles/${userId}`, {
    method: "GET",
  });
}

/**
 * Update the currently authenticated seeker's profile
 */
export async function updateMyProfile(
  data: UpdateSeekerProfilePayload
): Promise<SeekerProfile> {
  return apiRequest<SeekerProfile>("/seeker-profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Update a specific seeker profile by user ID (admin only)
 */
export async function updateProfile(
  userId: string,
  data: UpdateSeekerProfilePayload
): Promise<SeekerProfile> {
  return apiRequest<SeekerProfile>(`/seeker-profiles/${userId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
