import type { DbHealthResponse, HealthResponse } from '../types/health.types';

const API_URL = import.meta.env.VITE_API_URL;

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);

  if (!response.ok) {
    throw new Error(`Failed to fetch /health: ${response.status}`);
  }

  return response.json();
}

export async function fetchDbHealth(): Promise<DbHealthResponse> {
  const response = await fetch(`${API_URL}/health/db`);

  if (!response.ok) {
    throw new Error(`Failed to fetch /health/db: ${response.status}`);
  }

  return response.json();
}
