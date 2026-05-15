export type AiCitation = {
  id?: string;
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  chunkIndex: number;
  quote: string;
};

export type GroundedAiAnswer = {
  id?: string;
  threadId?: string;
  question: string;
  answer: string;
  citations: AiCitation[];
  provider: string;
  model: string;
  usedChunkCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateAiAnswerInput = {
  question: string;
  limit?: number;
};
