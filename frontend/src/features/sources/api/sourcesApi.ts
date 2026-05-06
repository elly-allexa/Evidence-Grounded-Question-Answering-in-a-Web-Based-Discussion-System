import { CURRENT_DEMO_USER_EMAIL } from '../../../config/demoUser';
import type { CreateSourceInput, SourceDocument } from '../types/source.types';
import type { SourceChunk } from '../types/sourceChunk.types';

const API_URL = import.meta.env.VITE_API_URL;
const DEMO_USER_EMAIL = CURRENT_DEMO_USER_EMAIL ?? 'demo@fer.local';

function getDemoUserHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-demo-user-email': DEMO_USER_EMAIL,
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
    // Ignore parse errors and use fallback.
  }

  return new Error(fallback);
}

export async function fetchSourcesByThreadId(threadId: string): Promise<SourceDocument[]> {
  const response = await fetch(`${API_URL}/threads/${threadId}/sources`);

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to fetch sources for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function createSource(
  threadId: string,
  data: CreateSourceInput,
): Promise<SourceDocument> {
  const response = await fetch(`${API_URL}/threads/${threadId}/sources`, {
    method: 'POST',
    headers: getDemoUserHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to create source for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function deleteSource(sourceId: string): Promise<void> {
  const response = await fetch(`${API_URL}/sources/${sourceId}`, {
    method: 'DELETE',
    headers: {
      'x-demo-user-email': DEMO_USER_EMAIL,
    },
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to delete source ${sourceId}: ${response.status}`);
  }
}

export async function fetchChunksBySourceId(sourceId: string): Promise<SourceChunk[]> {
  const response = await fetch(`${API_URL}/sources/${sourceId}/chunks`);

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to fetch chunks for source ${sourceId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function fetchChunksByThreadId(threadId: string): Promise<SourceChunk[]> {
  const response = await fetch(`${API_URL}/threads/${threadId}/chunks`);

  if (!response.ok) {
    throw await buildApiError(response, `Failed to fetch chunks for thread ${threadId}: ${response.status}`);
  }

  return response.json();
}
