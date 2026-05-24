"use client";

import { useState } from "react";
import Link from "next/link";
import type { SeekerNotification } from "@/types/problem";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SeekerRecentActivityProps {
  notifications: SeekerNotification[];
}

export function SeekerRecentActivity({ notifications }: SeekerRecentActivityProps) {
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const formatNotificationTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getTimelineGroup = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return "This Week";
    return "Earlier";
  };

  const getUniqueEventTypes = () => {
    const types = new Set(notifications.map(n => n.eventType));
    return Array.from(types);
  };

  const filteredNotifications = notifications.filter(n => {
    if (eventTypeFilter === "all") return true;
    return n.eventType === eventTypeFilter;
  });

  const groupedNotifications = filteredNotifications.reduce((acc, notification) => {
    const group = getTimelineGroup(notification.timestamp);
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(notification);
    return acc;
  }, {} as Record<string, SeekerNotification[]>);

  const timelineOrder = ["Today", "Yesterday", "This Week", "Earlier"];
  const orderedGroups = timelineOrder.filter(group => groupedNotifications[group]);

  const eventTypes = getUniqueEventTypes();

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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recent Activity</h2>
          <p className="text-sm text-gray-600 mt-1">
            Updates when solvers claim your problems or statuses change.
          </p>
        </div>
        <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
          <SelectTrigger className="w-[200px] px-4 py-2.5 !h-auto rounded-lg border border-gray-300 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="py-2.5">All Events</SelectItem>
            {eventTypes.map((type) => (
              <SelectItem key={type} value={type} className="py-2.5">
                {type.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredNotifications.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600">No activities match the selected filter</p>
        </div>
      )}

      {orderedGroups.length > 0 && (
        <div className="space-y-6">
          {orderedGroups.map((group) => (
            <div key={group}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200"></div>
                <span>{group}</span>
                <div className="h-px flex-1 bg-gray-200"></div>
              </h3>
              <div className="space-y-3">
                {groupedNotifications[group].map((n) => (
                  <Link
                    key={n.id}
                    href={`/seeker/problem/${n.problemId}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-accent hover:bg-accent/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{n.problemTitle}</p>
                        <p className="text-sm text-gray-700 mt-1">{n.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500">{n.actorName}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-full">
                            {n.eventType.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatNotificationTime(n.timestamp)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
