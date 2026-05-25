import type { Comment, CreateCommentInput, UpdateCommentInput } from '../types/comment.types';
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

export async function fetchCommentsByThreadId(threadId: string): Promise<Comment[]> {
  const response = await fetch(`${API_URL}/threads/${threadId}/comments`);

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to fetch comments for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function createComment(threadId: string, data: CreateCommentInput): Promise<Comment> {
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/threads/${threadId}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to create comment for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function updateComment(commentId: string, data: UpdateCommentInput): Promise<Comment> {
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to update comment ${commentId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function deleteComment(commentId: string): Promise<void> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_URL}/comments/${commentId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to delete comment ${commentId}: ${response.status}`,
    );
  }
}
