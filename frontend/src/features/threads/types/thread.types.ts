export type Thread = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateThreadInput = {
  title: string;
  content: string;
};

export type UpdateThreadInput = {
  title?: string;
  content?: string;
};