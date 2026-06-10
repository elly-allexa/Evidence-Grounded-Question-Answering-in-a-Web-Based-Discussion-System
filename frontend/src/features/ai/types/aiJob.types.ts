export type AiJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export type AiJob = {
  id: string;
  threadId: string;
  userId: string;
  question: string;
  limit: number;
  status: AiJobStatus;
  answerId?: string | null;
  error?: string | null;
  createdAt: string;
  updatedAt: string;
};
