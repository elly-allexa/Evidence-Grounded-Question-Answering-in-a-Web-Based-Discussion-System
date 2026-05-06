export type SourceType = 'text' | 'markdown';

export type SourceChunkCount = {
  chunks: number;
};

export type SourceDocument = {
  id: string;
  threadId: string;
  title: string;
  type: SourceType;
  contentText: string;
  createdAt: string;
  updatedAt: string;
  _count?: SourceChunkCount;
};

export type CreateSourceInput = {
  title: string;
  type: SourceType;
  contentText: string;
};
