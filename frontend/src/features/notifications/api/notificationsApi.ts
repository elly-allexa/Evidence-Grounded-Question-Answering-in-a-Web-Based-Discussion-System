import { buildAuthHeaders } from '../../auth/api/authApi';

const API_URL = import.meta.env.VITE_API_URL;

export type AppNotification = {
  id: string;
  type: 'THREAD_COMMENT' | 'COMMENT_REPLY' | 'AI_ANSWER_READY';
  title: string;
  message: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
};

export async function fetchNotifications(): Promise<AppNotification[]> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    return [];
  }

  const response = await fetch(`${API_URL}/notifications`, { headers });

  if (!response.ok) {
    throw new Error('Failed to fetch notifications');
  }

  return response.json();
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    return 0;
  }

  const response = await fetch(`${API_URL}/notifications/unread-count`, { headers });

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.count;
}

export async function markNotificationAsRead(id: string) {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    return;
  }

  await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers,
  });
}

export async function markAllNotificationsAsRead() {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    return;
  }

  await fetch(`${API_URL}/notifications/read-all`, {
    method: 'PATCH',
    headers,
  });
}
