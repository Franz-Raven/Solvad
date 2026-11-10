export interface AccountSettings {
  email: string;
  role: "SOLVER" | "SEEKER" | "ADMIN";
  authProvider: "LOCAL" | "GOOGLE";
  verified: boolean;
  /** false for Google sign-in accounts, which have no Solvad password */
  hasPassword: boolean;
  createdAt: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
