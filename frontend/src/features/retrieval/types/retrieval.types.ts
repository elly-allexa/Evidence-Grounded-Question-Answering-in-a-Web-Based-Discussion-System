export type RetrievedChunk = {
  chunkId: string;
  sourceId: string;
  sourceTitle: string;
  chunkIndex: number;
  text: string;
  score: number;
};

export type RetrieveChunksInput = {
  question: string;
  limit?: number;
};
