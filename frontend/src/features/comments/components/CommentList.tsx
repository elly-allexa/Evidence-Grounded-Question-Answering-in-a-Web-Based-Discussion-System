import { useEffect, useMemo, useState } from 'react';
import { deleteComment, updateComment } from '../api/commentsApi';
import type { Comment, DeleteCommentResult } from '../types/comment.types';
import { CommentEditForm } from './CommentEditForm';
import { CommentForm } from './CommentForm';
import { getDisplayUsername } from '../../../utils/displayUser';

const MAX_VISUAL_DEPTH = 4;

type CommentListProps = {
  threadId: string;
  comments: Comment[];
  currentUserId: string | null;
  onCommentCreated: (newComment: Comment) => void;
  onCommentUpdated: (updatedComment: Comment) => void;
  onCommentDeleted: (result: DeleteCommentResult) => void;
};

export function CommentList({
  threadId,
  comments,
  currentUserId,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
}: CommentListProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (!actionError) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setActionError('');
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [actionError]);

  const commentsByParent = useMemo(() => {
    const grouped = new Map<string | null, Comment[]>();

    for (const comment of comments) {
      const key = comment.parentId ?? null;
      const existing = grouped.get(key) ?? [];
      existing.push(comment);
      grouped.set(key, existing);
    }

    return grouped;
  }, [comments]);

  const topLevelComments = commentsByParent.get(null) ?? [];

  async function handleSave(commentId: string, content: string) {
    try {
      setActionError('');

      const updated = await updateComment(commentId, { content });
      onCommentUpdated(updated);
      setEditingCommentId(null);
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Unknown error');
      }
    }
  }

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this comment?');

    if (!confirmed) {
      return;
    }

    try {
      setActionError('');

      const result = await deleteComment(commentId);

      if (editingCommentId === commentId) {
        setEditingCommentId(null);
      }

      if (replyingToCommentId === commentId) {
        setReplyingToCommentId(null);
      }

      onCommentDeleted(result);
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Unknown error');
      }
    }
  }

  function renderComment(comment: Comment, depth = 0) {
    const isOwner = comment.authorId === currentUserId;
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToCommentId === comment.id;
    const childReplies = commentsByParent.get(comment.id) ?? [];
    const visualDepth = Math.min(depth, MAX_VISUAL_DEPTH);
    const isDeepBranch = depth >= MAX_VISUAL_DEPTH;

    return (
      <article
        key={comment.id}
        className={`comment-card ${isDeepBranch ? 'comment-card--deep' : ''}`}
        style={{ marginLeft: `${visualDepth * 24}px`, marginTop: '1rem' }}
      >
        {isDeepBranch && <div className="comment-card__branch">↩ Deep reply branch</div>}

        <div className="comment-card__author">
          <strong>@{getDisplayUsername(comment.author)}</strong>
        </div>

        {!isEditing ? (
          <p
            className={`comment-card__body ${
              comment.isDeleted ? 'comment-card__body--deleted' : ''
            }`}
          >
            {comment.content}
          </p>
        ) : (
          <CommentEditForm
            initialContent={comment.content}
            onSave={(content) => handleSave(comment.id, content)}
            onCancel={() => setEditingCommentId(null)}
          />
        )}

        <div className="comment-card__meta">
          <small>Posted: {new Date(comment.createdAt).toLocaleString()}</small>
          <br />
          <small>Updated: {new Date(comment.updatedAt).toLocaleString()}</small>
        </div>

        {!comment.isDeleted && !isEditing && (
          <div className="comment-card__actions">
            {currentUserId && (
              <button
                type="button"
                onClick={() =>
                  setReplyingToCommentId((prev) => (prev === comment.id ? null : comment.id))
                }
              >
                {isReplying ? 'Close reply' : 'Reply'}
              </button>
            )}

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActionError('');
                    setEditingCommentId(comment.id);
                  }}
                >
                  Edit
                </button>

                <button type="button" onClick={() => handleDelete(comment.id)}>
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {currentUserId && isReplying && (
          <CommentForm
            threadId={threadId}
            parentId={comment.id}
            placeholder={`Reply to @${getDisplayUsername(comment.author)}`}
            submitLabel="Post reply"
            onCommentCreated={onCommentCreated}
            onCancel={() => setReplyingToCommentId(null)}
          />
        )}

        {childReplies.length > 0 && (
          <div className="comment-card__replies">
            {childReplies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </article>
    );
  }

  if (topLevelComments.length === 0) {
    return (
      <section className="discussion-section">
        <h3>Replies</h3>
        {actionError && <p className="error-banner">{actionError}</p>}
        <p>No replies yet.</p>
      </section>
    );
  }

  return (
    <section className="discussion-section">
      <h3>Replies</h3>

      {actionError && <p className="error-banner">{actionError}</p>}

      <div>{topLevelComments.map((comment) => renderComment(comment))}</div>
    </section>
  );
}
