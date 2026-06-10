import type { CreateThreadInput, Thread, UpdateThreadInput } from '../types/thread.types';
import { buildAuthHeaders } from '../../auth/api/authApi';

const API_URL = import.meta.env.VITE_API_URL;

export type ThreadSort = 'newest' | 'popular' | 'active';

export type FetchThreadsParams = {
  search?: string;
  sort?: ThreadSort;
  limit?: number;
  skip?: number;
  mine?: boolean;
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
    // Ignore parse errors and use fallback.
  }

  return new Error(fallback);
}

function buildThreadQueryString(params: FetchThreadsParams): string {
  const searchParams = new URLSearchParams();

  if (params.search && params.search.trim()) {
    searchParams.set('search', params.search.trim());
  }

  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  if (params.limit !== undefined) {
    searchParams.set('limit', String(params.limit));
  }

  if (params.skip !== undefined) {
    searchParams.set('skip', String(params.skip));
  }

  if (params.mine) {
    searchParams.set('mine', 'true');
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : '';
}

export async function fetchThreads(params: FetchThreadsParams = {}): Promise<Thread[]> {
  const queryString = buildThreadQueryString(params);
  const headers = params.mine ? buildAuthHeaders(false) : undefined;

  const response = await fetch(`${API_URL}/threads${queryString}`, {
    headers: headers ?? undefined,
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch threads: ${response.status}`);
  }

  return response.json();
}

export async function fetchThreadById(id: string): Promise<Thread> {
  const response = await fetch(`${API_URL}/threads/${id}`);

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch thread ${id}: ${response.status}`);
  }

  return response.json();
}

export async function createThread(data: CreateThreadInput): Promise<Thread> {
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/threads`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to create thread: ${response.status}`);
  }

  return response.json();
}

export async function updateThread(id: string, data: UpdateThreadInput): Promise<Thread> {
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/threads/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to update thread ${id}: ${response.status}`);
  }

  return response.json();
}

export async function deleteThread(id: string): Promise<void> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/threads/${id}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to delete thread ${id}: ${response.status}`);
  }
}
