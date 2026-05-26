const API_URL = import.meta.env.VITE_API_URL;

export type UserProfile = {
  id: string;
  email: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
};

export type UpdateProfileInput = {
  username?: string;
  bio?: string;
};

function getToken() {
  return localStorage.getItem('access_token');
}

export function getAuthToken() {
  return getToken();
}

export function buildAuthHeaders(includeJson = true) {
  const token = getToken();

  if (!token) {
    return null;
  }

  return {
    ...(includeJson ? { 'Content-Type': 'application/json' } : {}),
    Authorization: `Bearer ${token}`,
  };
}

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

export async function fetchMe(): Promise<UserProfile> {
  const token = getToken();

  if (!token) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch profile: ${response.status}`);
  }

  return response.json();
}

export async function updateMe(data: UpdateProfileInput): Promise<UserProfile> {
  const token = getToken();

  if (!token) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/auth/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to update profile: ${response.status}`);
  }

  return response.json();
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/auth/me/avatar`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to upload avatar: ${response.status}`);
  }

  return response.json();
}
