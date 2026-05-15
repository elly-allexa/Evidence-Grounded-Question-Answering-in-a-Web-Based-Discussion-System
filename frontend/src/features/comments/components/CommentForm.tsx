import { useState } from 'react';
import { createComment } from '../api/commentsApi';
import type { Comment } from '../types/comment.types';

type CommentFormProps = {
  threadId: string;
  parentId?: string;
  placeholder?: string;
  submitLabel?: string;
  onCommentCreated: (newComment: Comment) => void;
  onCancel?: () => void;
};

export function CommentForm({
  threadId,
  parentId,
  placeholder = 'Write your reply here...',
  submitLabel = 'Post reply',
  onCommentCreated,
  onCancel,
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setError('Comment content is required.');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      const newComment = await createComment(threadId, {
        content: normalizedContent,
        ...(parentId ? { parentId } : {}),
      });

      setContent('');
      onCommentCreated(newComment);
      onCancel?.();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {error && <p className="error-banner">{error}</p>}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        maxLength={3000}
        placeholder={placeholder}
        className="comment-form__textarea"
        disabled={isSubmitting}
      />

      <div className="field-meta comment-form__meta">{content.length}/3000 characters</div>

      <div className="action-row">
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : submitLabel}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
