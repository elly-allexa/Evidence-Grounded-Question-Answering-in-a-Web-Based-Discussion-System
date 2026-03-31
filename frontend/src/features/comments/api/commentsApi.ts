import type { Comment, CreateCommentInput } from '../types/comment.types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchCommentsByThreadId(threadId: string): Promise<Comment[]> {
  const response = await fetch(`${API_URL}/threads/${threadId}/comments`);

  if (!response.ok) {
    throw new Error(`Failed to fetch comments for thread ${threadId}: ${response.status}`);
  }

  return response.json();
}

export async function createComment(threadId: string, data: CreateCommentInput): Promise<Comment> {
  const response = await fetch(`${API_URL}/threads/${threadId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to create comment for thread ${threadId}: ${response.status}`);
  }

  return response.json();
}
