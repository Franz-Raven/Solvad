import Link from "next/link";
import type { SeekerNotification } from "@/types/problem";

interface SeekerRecentActivityProps {
  notifications: SeekerNotification[];
}

export function SeekerRecentActivity({ notifications }: SeekerRecentActivityProps) {
  const formatNotificationTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
        <div className="text-center py-12">
          <svg
            className="w-16 h-16 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No recent activity
          </h3>
          <p className="text-gray-600">
            Updates will appear here when solvers interact with your problems
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-secondary/30 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Activity</h2>
      <p className="text-sm text-gray-600 mb-4">
        Updates when solvers claim your problems or statuses change.
      </p>
      <div className="space-y-3 max-h-[600px] overflow-y-auto">
        {notifications.map((n) => (
          <Link
            key={n.id}
            href={`/seeker/problem/${n.problemId}`}
            className="block p-4 rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-gray-900">{n.problemTitle}</p>
                <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {n.actorName} • {n.eventType.replace(/_/g, " ")}
                </p>
              </div>
              <span className="text-xs text-gray-400 whitespace-nowrap">
                {formatNotificationTime(n.timestamp)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
