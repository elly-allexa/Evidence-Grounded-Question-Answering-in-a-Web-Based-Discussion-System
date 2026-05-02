import { useMemo, useState } from 'react';
import { deleteComment, updateComment } from '../api/commentsApi';
import type { Comment } from '../types/comment.types';
import { CommentEditForm } from './CommentEditForm';
import { CommentForm } from './CommentForm';

const CURRENT_USER_ID = '23999eaf-33e1-42ad-8242-bd9b68c353eb';

type CommentListProps = {
  threadId: string; 
  comments: Comment[];
  onCommentCreated: (newComment: Comment) => void;
  onCommentUpdated: (updatedComment: Comment) => void;
  onCommentDeleted: (deletedCommentId: string, replacement?: Comment) => void;
};

export function CommentList({
  threadId,
  comments,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
}: CommentListProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

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
    const updated = await updateComment(commentId, { content });
    onCommentUpdated(updated);
    setEditingCommentId(null);
  }

  async function handleDelete(commentId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this comment?');

    if (!confirmed) {
      return;
    }

    try {
      setActionError('');
      const result = await deleteComment(commentId);

      if (result && typeof result === 'object' && 'content' in result) {
        onCommentDeleted(commentId, result as Comment);
      } else {
        onCommentDeleted(commentId);
      }
    } catch (err) {
      if (err instanceof Error) {
        setActionError(err.message);
      } else {
        setActionError('Unknown error');
      }
    }
  }

  function renderComment(comment: Comment, depth = 0) {
    const isOwner = comment.authorId === CURRENT_USER_ID;
    const isEditing = editingCommentId === comment.id;
    const isReplying = replyingToCommentId === comment.id;
    const childReplies = commentsByParent.get(comment.id) ?? [];

    return (
      <article
        key={comment.id}
        style={{
          border: '1px solid #ddd',
          borderRadius: '8px',
          padding: '1rem',
          marginLeft: `${depth * 24}px`,
          marginTop: '1rem',
        }}
      >
        <div style={{ marginBottom: '0.5rem', color: '#444' }}>
          <strong>{comment.author.username}</strong>
        </div>

        {!isEditing ? (
          <p
            style={{ marginBottom: '0.75rem', fontStyle: comment.isDeleted ? 'italic' : 'normal' }}
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

        <div style={{ color: '#666', fontSize: '0.9rem' }}>
          <small>Posted: {new Date(comment.createdAt).toLocaleString()}</small>
          <br />
          <small>Updated: {new Date(comment.updatedAt).toLocaleString()}</small>
        </div>

        {!comment.isDeleted && !isEditing && (
          <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() =>
                setReplyingToCommentId((prev) => (prev === comment.id ? null : comment.id))
              }
            >
              {isReplying ? 'Close reply' : 'Reply'}
            </button>

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

        {isReplying && (
          <CommentForm
            threadId={threadId}
            parentId={comment.id}
            placeholder={`Reply to @${comment.author.username}`}
            submitLabel="Post reply"
            onCommentCreated={onCommentCreated}
            onCancel={() => setReplyingToCommentId(null)}
          />
        )}

        {childReplies.length > 0 && (
          <div style={{ marginTop: '0.5rem' }}>
            {childReplies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </article>
    );
  }

  if (topLevelComments.length === 0) {
    return (
      <section style={{ marginTop: '2rem' }}>
        <h3>Replies</h3>
        {actionError && <p style={{ color: 'red' }}>{actionError}</p>}
        <p>No replies yet.</p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3>Replies</h3>

      {actionError && <p style={{ color: 'red' }}>{actionError}</p>}

      <div>{topLevelComments.map((comment) => renderComment(comment))}</div>
    </section>
  );
}
