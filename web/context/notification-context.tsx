'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { webSocketService } from '@/lib/websocket';
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications';
import type { Notification } from '@/types/notification';
import { getValidToken } from '@/lib/auth-utils';

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const knownIds = useRef<Set<string>>(new Set());

  // Load history + unread total over REST (source of truth for offline users).
  const refresh = useCallback(async () => {
    try {
      const [history, unread] = await Promise.all([getNotifications(), getUnreadCount()]);
      knownIds.current = new Set(history.map((n) => n.id));
      setNotifications(history);
      setUnreadCount(unread.count);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, []);

  // Live push: de-duplicate by id, prepend, bump badge.
  const handleIncoming = useCallback((incoming: Notification) => {
    if (knownIds.current.has(incoming.id)) return;
    knownIds.current.add(incoming.id);
    setNotifications((prev) => [incoming, ...prev]);
    if (!incoming.read) setUnreadCount((count) => count + 1);
  }, []);

  // Initial history
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      if (!cancelled) setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  // One WebSocket connection for the lifetime of the authed layout
  useEffect(() => {
    const token = getValidToken();
    if (!token) return;

    const unsubscribe = webSocketService.subscribeToNotifications(handleIncoming, () => {
      void refresh(); // reconnected: pull anything missed while the socket was down
    });
    webSocketService
      .connect(token)
      .catch((err) => console.error('Notification WebSocket failed', err));

    return () => {
      unsubscribe();
      webSocketService.disconnect();
    };
  }, [handleIncoming, refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n.id === id);
      if (!target || target.read) return;

      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((count) => Math.max(0, count - 1));
      try {
        await markNotificationRead(id);
      } catch (err) {
        console.error('Failed to mark notification as read', err);
        await refresh(); // roll back to server state
      }
    },
    [notifications, refresh],
  );

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
      await refresh();
    }
  }, [refresh]);

  const value = useMemo<NotificationContextValue>(
    () => ({ notifications, unreadCount, isLoading, markAsRead, markAllAsRead }),
    [notifications, unreadCount, isLoading, markAsRead, markAllAsRead],
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationProvider>');
  }
  return ctx;
}