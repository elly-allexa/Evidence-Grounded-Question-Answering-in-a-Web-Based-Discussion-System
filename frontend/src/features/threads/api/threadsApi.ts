import type { Thread, CreateThreadInput, UpdateThreadInput } from '../types/thread.types';

const API_URL = import.meta.env.VITE_API_URL;

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
    // Ignore JSON parse issues and use fallback.
  }

  return new Error(fallback);
}

export async function fetchThreads(): Promise<Thread[]> {
  const response = await fetch(`${API_URL}/threads`);

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch threads: ${response.status}`);
  }

  return response.json();
}

export async function fetchThreadById(id: string): Promise<Thread> {
  const response = await fetch(`${API_URL}/threads/${id}`);

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch thread id ${id}: ${response.status}`);
  }

  return response.json();
}

export async function createThread(data: CreateThreadInput): Promise<Thread> {
  const response = await fetch(`${API_URL}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to create a thread: ${response.status}`);
  }

  return response.json();
}

export async function updateThread(id: string, data: UpdateThreadInput): Promise<Thread> {
  const response = await fetch(`${API_URL}/threads/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to update thread ${id}: ${response.status}`);
  }

  return response.json();
}

export async function deleteThread(id: string): Promise<void> {
  const response = await fetch(`${API_URL}/threads/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to delete thread ${id}: ${response.status}`);
  }
}
