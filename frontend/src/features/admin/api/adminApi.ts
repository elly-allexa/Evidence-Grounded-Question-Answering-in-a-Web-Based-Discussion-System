import { buildAuthHeaders } from '../../auth/api/authApi';

const API_URL = import.meta.env.VITE_API_URL;

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  isRootAdmin: boolean;
  _count: {
    threads: number;
    comments: number;
    aiJobs: number;
  };
};

export type AdminUsersResponse = {
  total: number;
  users: AdminUser[];
};

export type UpdateUserRoleInput = {
  role: 'USER' | 'ADMIN';
};

async function buildApiError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json();
    const message = payload?.message;

    if (Array.isArray(message)) {
      return new Error(message.join(', '));
    }

    if (typeof message === 'string' && message.length > 0) {
      return new Error(message);
    }
  } catch {
    // Ignore parse errors.
  }

  return new Error(fallback);
}

export async function fetchAdminUsers(search = ''): Promise<AdminUsersResponse> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const searchParams = new URLSearchParams();

  if (search.trim()) {
    searchParams.set('search', search.trim());
  }

  searchParams.set('limit', '50');

  const response = await fetch(`${API_URL}/admin/users?${searchParams.toString()}`, {
    headers,
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch admin users: ${response.status}`);
  }

  return response.json();
}

export async function updateUserRole(userId: string, role: UpdateUserRoleInput['role']): Promise<AdminUser> {
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ role }),
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to update role for user ${userId}: ${response.status}`);
  }

  return response.json();
}