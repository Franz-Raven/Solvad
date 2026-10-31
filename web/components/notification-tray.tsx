'use client';

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { useRouter } from 'next/navigation';
import Portal from '@/components/portal';
import { useNotifications } from '@/context/notification-context';
import { useAuth } from '@/context/auth-context';
import type { Notification } from '@/types/notification';

const PANEL_GAP = 8;
const VIEWPORT_MARGIN = 8;

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

interface NotificationItemProps {
  notification: Notification;
  onSelect: (notification: Notification) => void;
}

function NotificationItem({ notification, onSelect }: NotificationItemProps) {
  const { message, read, createdAt } = notification;

  return (
    <li className="border-b border-input last:border-b-0">
      <button
        type="button"
        onClick={() => onSelect(notification)}
        className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
      >
        <span
          aria-hidden="true"
          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
            read ? 'bg-transparent' : 'bg-accent'
          }`}
        />
        <span className="min-w-0 flex-1">
          {!read && <span className="sr-only">Unread: </span>}
          <span className={`block wrap-break-word text-sm ${read ? 'text-slate-600' : 'font-semibold text-slate-900'}`}>
            {message}
          </span>
          <span className="mt-1 block text-xs text-slate-500">
            {formatRelativeTime(createdAt)}
          </span>
        </span>
      </button>
    </li>
  );
}

interface NotificationTrayProps {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
}

export function NotificationTray({ open, anchorRef, onClose }: NotificationTrayProps) {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } = useNotifications();
  const { user } = useAuth(); // Get role
  const router = useRouter();
  
  const panelRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; right: number } | null>(null);

  const sorted = useMemo(
    () =>
      [...notifications].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [notifications],
  );

  useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = anchorRef.current?.getBoundingClientRect();
      if (!rect) return;
      const top = rect.bottom + PANEL_GAP;
      const right = Math.max(VIEWPORT_MARGIN, window.innerWidth - rect.right);
      setPosition((prev) => (prev && prev.top === top && prev.right === right ? prev : { top, right }));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        anchorRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !position) return null;

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    
    // Close the tray
    onClose();

    if (notification.type === 'PROPOSAL_SUBMITTED') {
      // route them to their specific problem
      router.push(`/seeker/problem/${notification.problemId}?tab=proposals`);    
    } 
    else if (notification.type === 'PROPOSAL_APPROVED' || notification.type === 'PROPOSAL_REJECTED') {
     router.push(`/solver/problem/${notification.problemId}?tab=workspace`);
    }
    else {
      // Fallback
      if (user?.role === 'SEEKER') router.push('/seeker/dashboard');
      else if (user?.role === 'SOLVER') router.push('/solver/dashboard');
    }
  };

  return (
    <Portal>
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Notifications"
        className="fixed z-50 flex max-h-112 w-88 max-w-[calc(100vw-1rem)] flex-col overflow-hidden rounded-lg border border-input bg-background shadow-lg"
        style={{ top: position.top, right: position.right }}
      >
        <div className="flex items-center justify-between border-b border-input px-4 py-3">
          <h2 className="text-sm font-semibold">Notifications</h2>
          <button
            type="button"
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0}
            className="text-xs font-medium text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            Mark all as read
          </button>
        </div>

        <div className="overflow-y-auto">
          {isLoading && sorted.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm opacity-70">Loading…</p>
          ) : sorted.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm opacity-70">No notifications yet</p>
          ) : (
            <ul>
              {sorted.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onSelect={handleNotificationClick} // <-- Using the new handler
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </Portal>
  );
}