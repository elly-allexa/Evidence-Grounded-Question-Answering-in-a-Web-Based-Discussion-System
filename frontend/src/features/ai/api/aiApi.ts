import type { CreateAiAnswerInput, GroundedAiAnswer } from '../types/ai.types';
import type { AiJob } from '../types/aiJob.types';
import { buildAuthHeaders } from '../../auth/api/authApi';

const API_URL = import.meta.env.VITE_API_URL;

export type AiLimits = {
  used: number;
  limit: number;
  remaining: number;
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

export async function enqueueGroundedAiAnswer(
  threadId: string,
  data: CreateAiAnswerInput,
): Promise<AiJob> {
  const headers = buildAuthHeaders();

  if (!headers) {
    throw new Error('Sign in to ask AI.');
  }

  const response = await fetch(`${API_URL}/threads/${threadId}/ai/answers`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to generate AI answer for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function fetchAiAnswersByThreadId(threadId: string): Promise<GroundedAiAnswer[]> {
  const response = await fetch(`${API_URL}/threads/${threadId}/ai-answers`);

  if (!response.ok) {
    throw await buildApiError(
      response,
      `Failed to fetch AI answers for thread ${threadId}: ${response.status}`,
    );
  }

  return response.json();
}

export async function fetchMyAiJobs(): Promise<AiJob[]> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    return [];
  }

  const response = await fetch(`${API_URL}/ai/jobs`, {
    headers,
  });

  if (!response.ok) {
    return [];
  }

  return response.json();
}

export async function fetchMyAiLimits(): Promise<AiLimits | null> {
  const headers = buildAuthHeaders(false);

  if (!headers) {
    return null;
  }

  const response = await fetch(`${API_URL}/ai/limits`, {
    headers,
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}
