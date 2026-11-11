import { apiRequest } from "@/lib/api";
import type { AccountSettings, ChangePasswordPayload } from "@/types/account";

export async function getAccountSettings(): Promise<AccountSettings> {
  return apiRequest<AccountSettings>("/account/settings", { method: "GET" });
}

export async function changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
  return apiRequest<{ message: string }>("/account/password", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
