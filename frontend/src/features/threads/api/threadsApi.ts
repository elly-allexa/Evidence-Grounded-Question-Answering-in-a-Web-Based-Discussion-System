import type { Thread } from '../types/thread.types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchThreads(): Promise<Thread[]> {
  const response = await fetch(`${API_URL}/threads`);

  if (!response.ok) {
    throw new Error(`Failed to fetch threads: ${response.status}`);
  }

  return response.json();
}

export async function fetchThreadsById(id: string): Promise<Thread> {
  const response = await fetch(`${API_URL}/threads/${id}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch thread id ${id}: ${response.status}`);
  }

  return response.json();
}

export async function createThread(data: {
        title: string;
        content: string
}): Promise<Thread> {
  const response = await fetch(`${API_URL}/threads`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
    
  if (!response.ok) {
    throw new Error(`Failed to create a thread: ${response.status}`);
  }

  return response.json();
}
