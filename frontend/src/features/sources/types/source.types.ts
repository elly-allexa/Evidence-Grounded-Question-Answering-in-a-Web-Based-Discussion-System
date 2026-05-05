export type SourceType = 'text' | 'markdown';

export type SourceDocument = {
  id: string;
  threadId: string;
  title: string;
  type: SourceType;
  contentText: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSourceInput = {
  title: string;
  type: SourceType;
  contentText: string;
};
