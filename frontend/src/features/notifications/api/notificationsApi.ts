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

  const response = await fetch(`${API_URL}/notifications`, {
    headers,
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/notifications/${id}/read`, {
    method: 'PATCH',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to mark notification as read');
  }

  return response.json();
}
