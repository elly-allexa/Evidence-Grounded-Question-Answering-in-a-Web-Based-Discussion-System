export type Comment = {
  id: string;
  content: string;
  authorId: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateCommentInput = {
  content: string;
};
