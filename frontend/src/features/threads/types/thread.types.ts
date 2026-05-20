export type ThreadAuthor = {
  id: string;
  username: string;
};

export type Thread = {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    username: string;
    email?: string;
  };
  _count?: {
    comments?: number;
    sources?: number;
    aiAnswers?: number;
  };
};

export type CreateThreadInput = {
  title: string;
  content: string;
};

export type UpdateThreadInput = {
  title?: string;
  content?: string;
};
