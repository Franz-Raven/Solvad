export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "Just now";
  return new Date(value).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function getTimelineGroup(value: string | undefined | null): string {
  if (!value) return "Today";
  const diffDays = Math.floor((Date.now() - new Date(value).getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return "This Week";
  return "Earlier";
}

export const TIMELINE_GROUPS = ["Today", "Yesterday", "This Week", "Earlier"] as const;

export function humanizeEnum(value: string): string {
  if (value === "SOLVED_OPEN_FOR_IMPROVEMENT") return "Open for Improvement";
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function getProblemStatusBadge(status: string): string {
  switch (status) {
    case "OPEN":
      return "bg-accent/10 text-accent border-accent/20";
    case "CLAIMED":
    case "IN_PROGRESS":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "SOLVED_OPEN_FOR_IMPROVEMENT":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "COMPLETED":
      return "bg-green-50 text-green-700 border-green-200";
    default:
      return "bg-slate-50 text-slate-700 border-slate-200";
  }
}

export function getEventBadge(eventType: string): string {
  switch (eventType) {
    case "PROBLEM_CREATED":
    case "PROPOSAL_SUBMITTED":
      return "bg-accent/10 text-accent border-accent/20";
    case "ATTEMPT_CLAIMED":
    case "ATTEMPT_FORKED":
    case "PROPOSAL_APPROVED":
    case "ATTEMPT_COMPLETED":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "SUBTASK_SUBMITTED":
    case "FILE_UPLOADED":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "PROPOSAL_REJECTED":
    case "ATTEMPT_ABANDONED":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "CAPACITY_REACHED":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export function getRoleBadge(role: string): string {
  switch (role) {
    case "SOLVER":
      return "bg-secondary/10 text-secondary border-secondary/20";
    case "SEEKER":
      return "bg-primary-foreground/10 text-primary-foreground border-primary-foreground/20";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
