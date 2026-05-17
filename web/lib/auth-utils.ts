import type { UserRole } from "@/types/auth";

export function setAuthCookies(token: string, role: UserRole): void {
  const maxAge = 60 * 60 * 24 * 7;
  document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; SameSite=Lax`;
  document.cookie = `userRole=${role}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function clearAuthCookies(): void {
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
  document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
}

export function setAuthStorage(data: {
  token: string;
  userId: string;
  email: string;
  role: UserRole;
}): void {
  localStorage.setItem("token", data.token);
  localStorage.setItem("userId", data.userId);
  localStorage.setItem("userEmail", data.email);
  localStorage.setItem("userRole", data.role);
}

export function clearAuthStorage(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userRole");
}

export function getDashboardPath(role: UserRole): string {
  const roleRoutes: Record<UserRole, string> = {
    SOLVER: "/solver/dashboard",
    SEEKER: "/seeker/dashboard",
    ADMIN: "/admin/dashboard",
  };
  return roleRoutes[role];
}

export function performLogout(): void {
  clearAuthCookies();
  clearAuthStorage();
}
