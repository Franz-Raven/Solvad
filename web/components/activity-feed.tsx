// components/activity-feed.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import type { ActivityLedgerResponse, ActivityActionType } from "@/types/activity";

interface ActivityFeedProps {
  activities: ActivityLedgerResponse[];
}

export default function ActivityFeed({ activities }: ActivityFeedProps) {
  if (!activities || activities.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  const getEventIconAndColor = (type: ActivityActionType) => {
    switch (type) {
      case "PROBLEM_CREATED":
        return { color: "bg-accent", icon: "✨" };
      case "STATUS_CHANGE":
        return { color: "bg-secondary", icon: "🔄" };
      case "FILE_UPLOAD":
        return { color: "bg-primary-foreground", icon: "📎" };
      case "CLAIMED":
        return { color: "bg-accent", icon: "👤" };
      case "SOLUTION_SUBMITTED":
        return { color: "bg-green-500", icon: "✅" };
      default:
        return { color: "bg-gray-400", icon: "📝" };
    }
  };

  return (
    <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
      {activities.map((activity) => {
        const { color, icon } = getEventIconAndColor(activity.actionType);

        return (
          <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            {/* Timeline Icon */}
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-background shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm ${color} text-white z-10`}>
              {icon}
            </div>

            {/* Event Card */}
            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-card border border-border p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-sm">
                  {activity.description}
                </span>
                <span className="text-xs text-muted-foreground ml-2 whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                by <span className="font-medium text-secondary">{activity.actorName}</span> ({activity.actorRole})
              </p>
              {activity.metadata && (
                <div className="mt-2 text-sm text-foreground bg-muted/50 p-2 rounded-lg border border-border inline-block">
                  {activity.metadata}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}