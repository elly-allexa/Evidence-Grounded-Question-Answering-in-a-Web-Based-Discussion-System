import { useState } from 'react';
import { createComment } from '../api/commentsApi';

type CommentFormProps = {
  threadId: string;
  onCommentCreated: () => Promise<void> | void;
};

export function CommentForm({ threadId, onCommentCreated }: CommentFormProps) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setError('Reply content is required.');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      await createComment(threadId, { content: normalizedContent });

      setContent('');
      await onCommentCreated();
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
    <form onSubmit={handleSubmit} style={{ marginTop: '2rem' }}>
      <h3>Reply to this thread</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={5}
        placeholder="Write your reply here..."
        style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
        disabled={isSubmitting}
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Posting...' : 'Post reply'}
      </button>
    </form>
  );
}
