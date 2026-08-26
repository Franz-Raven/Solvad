import { apiRequest } from "../../../../lib/api";

export async function uploadProfilePicture(file: File): Promise<{ profileUrl: string }> {
  const formData = new FormData();
  formData.append("file", file);

  return apiRequest<{ profileUrl: string }>("/users/me/profile-picture", {
    method: "POST",
    body: formData,
  });
}
