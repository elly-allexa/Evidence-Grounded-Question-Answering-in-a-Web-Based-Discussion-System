import { useState } from 'react';
import { createThread } from '../api/threadsApi';
import { MAX_THREAD_CONTENT_LENGTH, MAX_THREAD_TITLE_LENGTH } from '../../../config/limits';

type ThreadFormProps = {
  onThreadCreated: () => void;
};

export function ThreadForm({ onThreadCreated }: ThreadFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedContent = content.trim();

    if (!normalizedTitle || !normalizedContent) {
      setError('Title and content are required.');
      return;
    }

    if (normalizedTitle.length > MAX_THREAD_TITLE_LENGTH) {
      setError(`Title must be at most ${MAX_THREAD_TITLE_LENGTH} characters.`);
      return;
    }

    if (normalizedContent.length > MAX_THREAD_CONTENT_LENGTH) {
      setError(`Content must be at most ${MAX_THREAD_CONTENT_LENGTH} characters.`);
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      await createThread({ title: normalizedTitle, content: normalizedContent });

      setTitle('');
      setContent('');
      onThreadCreated();
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
    <form onSubmit={handleSubmit} style={{ marginBottom: '2rem' }}>
      <h2>Create thread</h2>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Thread title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_THREAD_TITLE_LENGTH}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={isSubmitting}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <textarea
          placeholder="Thread body"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_THREAD_CONTENT_LENGTH}
          rows={6}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={isSubmitting}
        />
        <div
          style={{
            textAlign: 'right',
            fontSize: '0.85rem',
            color: content.length > MAX_THREAD_CONTENT_LENGTH ? 'red' : '#666',
          }}
        >
          {content.length}/{MAX_THREAD_CONTENT_LENGTH}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
