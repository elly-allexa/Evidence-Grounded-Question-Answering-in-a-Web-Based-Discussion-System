export type CommentAuthor = {
  id: string;
  username: string;
  avatarUrl?: string | null;
};

export type Comment = {
  id: string;
  content: string;
  authorId: string;
  threadId: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  parentId?: string | null;
  author: CommentAuthor;
};

export type CreateCommentInput = {
  content: string;
  parentId?: string;
};

export type UpdateCommentInput = {
  content?: string;
};

export type DeleteCommentResult =
  | {
      mode: 'hard';
      deletedCommentIds: string[];
    }
  | {
      mode: 'soft';
      comment: Comment;
    };
