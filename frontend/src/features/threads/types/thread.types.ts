export type ThreadAuthor = {
  id: string;
  username: string;
};

export type Thread = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  author: ThreadAuthor;
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
