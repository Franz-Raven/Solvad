export interface AdminDashboardStats {
  totalUsers: number;
  solvers: number;
  seekers: number;
  newUsersThisWeek: number;
  unverifiedUsers: number;
  totalProblems: number;
  openProblems: number;
  activeProblems: number;
  solvedProblems: number;
  activeAttempts: number;
  pendingReviews: number;
  completedAttempts: number;
}

export interface AdminActivity {
  id: string;
  problemId: string;
  problemTitle: string;
  actorName: string;
  actorRole: string;
  eventType: string;
  delta: string | null;
  timestamp: string;
}

export type AdminListedRole = "SOLVER" | "SEEKER";

export interface AdminUser {
  userId: string;
  email: string;
  role: AdminListedRole;
  /** Solver full name, or seeker organization name */
  displayName: string;
  /** Solver institution, or seeker contact person */
  detail: string | null;
  /** Solver degree program, or seeker contact number */
  secondaryDetail: string | null;
  profileUrl: string | null;
  verified: boolean;
  authProvider: "LOCAL" | "GOOGLE";
  createdAt: string;
}

export interface AdminProblem {
  id: string;
  title: string;
  organizationName: string;
  status: string;
  preferredProgram: string | null;
  sdgFocus: string | null;
  createdAt: string;
}

export interface AdminPage<T> {
  content: T[];
  page: number;
  totalPages: number;
  totalElements: number;
  size: number;
}

export interface AdminAnalytics {
  userGrowth: { month: string; solvers: number; seekers: number }[];
  platformActivity: { month: string; problemsPosted: number; attemptsStarted: number; solutionsCompleted: number }[];
  /** Same shape as ProblemStatusGroupDto (shared DonutChart). */
  problemStatus: { open: number; active: number; solvedNeedsImprovement: number; completed: number; closed: number };
  /** Same shape as SdgDistributionDto[] (shared SDG BarChart). */
  sdgDistribution: { sdgFocus: string; problemCount: number }[];
  attemptOutcomes: { status: string; count: number }[];
  programDemand: { program: string; problems: number; solvers: number }[];
  topPartners: { organizationName: string; problems: number }[];
}
