const API_URL = import.meta.env.VITE_API_URL;

export type PublicUserProfile = {
  id: string;
  username: string;
  avatarUrl?: string | null;
  bio?: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  _count: {
    threads: number;
    comments: number;
  };
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

export async function fetchPublicUserProfile(username: string): Promise<PublicUserProfile> {
  const response = await fetch(`${API_URL}/users/${encodeURIComponent(username)}`);

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch user profile: ${response.status}`);
  }

  return response.json();
}
