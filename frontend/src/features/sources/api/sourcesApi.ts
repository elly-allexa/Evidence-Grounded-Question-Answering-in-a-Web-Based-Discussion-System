import type { CreateSourceInput, SourceDocument } from '../types/source.types';
import type { SourceChunk } from '../types/sourceChunk.types';
import { buildAuthHeaders } from '../../auth/api/authApi';

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
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/threads/${threadId}/sources`, {
    method: 'POST',
    headers,
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

export async function uploadPdfSource(
  threadId: string,
  file: File,
  title?: string,
): Promise<SourceDocument> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const formData = new FormData();
  formData.append('file', file);

  if (title?.trim()) {
    formData.append('title', title.trim());
  }

  const response = await fetch(`${API_URL}/threads/${threadId}/sources/pdf`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!response.ok) {
    throw await buildApiError(response, `Failed to upload PDF source: ${response.status}`);
  }

  return response.json();
}

export async function deleteSource(sourceId: string): Promise<void> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/sources/${sourceId}`, {
    method: 'DELETE',
    headers,
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
    throw await buildApiError(
      response,
      `Failed to fetch chunks for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}
