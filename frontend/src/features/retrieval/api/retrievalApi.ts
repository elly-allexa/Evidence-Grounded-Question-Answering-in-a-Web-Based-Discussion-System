import type { RetrievedChunk, RetrieveChunksInput } from '../types/retrieval.types';

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
    // Ignore parse errors and use fallback.
  }

  return new Error(fallback);
}

export async function retrieveChunks(
  threadId: string,
  data: RetrieveChunksInput,
): Promise<RetrievedChunk[]> {
  const response = await fetch(`${API_URL}/threads/${threadId}/retrieve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to retrieve chunks for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}
