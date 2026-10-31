import { apiRequest } from '@/lib/api';
import type { Notification, UnreadCountResponse } from '@/types/notification';

export function getNotifications(page = 0, size = 20) {
  return apiRequest<Notification[]>(`/notifications?page=${page}&size=${size}`);
}

export function getUnreadCount() {
  return apiRequest<UnreadCountResponse>('/notifications/unread-count');
}

export function markNotificationRead(id: string) {
  return apiRequest<Notification>(`/notifications/${id}/read`, { method: 'POST' });
}

export function markAllNotificationsRead() {
  return apiRequest<{ updated: number }>('/notifications/read-all', { method: 'POST' });
}