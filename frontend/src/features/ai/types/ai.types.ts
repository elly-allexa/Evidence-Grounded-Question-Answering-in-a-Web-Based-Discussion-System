export type AiCitation = {
  sourceId: string;
  sourceTitle: string;
  chunkId: string;
  chunkIndex: number;
  quote: string;
};

export type GroundedAiAnswer = {
  answer: string;
  citations: AiCitation[];
  provider: string;
  model: string;
  usedChunkCount: number;
};

export type CreateAiAnswerInput = {
  question: string;
  limit?: number;
};
