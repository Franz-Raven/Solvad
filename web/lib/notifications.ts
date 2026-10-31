import { apiRequest } from '@/lib/api';
import type { Notification, UnreadCountResponse } from '@/types/notification';

export function getNotifications(page = 0, size = 20) {
  return apiRequest<Notification[]>(`/api/notifications?page=${page}&size=${size}`);
}

export function getUnreadCount() {
  return apiRequest<UnreadCountResponse>('/api/notifications/unread-count');
}

export function markNotificationRead(id: string) {
  return apiRequest<Notification>(`/api/notifications/${id}/read`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>('/api/notifications/read-all', { method: 'POST' });
}