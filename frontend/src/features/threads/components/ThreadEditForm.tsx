import { useState } from 'react';
import { MAX_THREAD_CONTENT_LENGTH, MAX_THREAD_TITLE_LENGTH } from '../../../config/limits';

type ThreadEditFormProps = {
  initialTitle: string;
  initialContent: string;
  onSave: (data: { title: string; content: string }) => Promise<void>;
  onCancel: () => void;
};

export function ThreadEditForm({
  initialTitle,
  initialContent,
  onSave,
  onCancel,
}: ThreadEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError('');
      setIsSaving(true);
      if (title.trim().length > MAX_THREAD_TITLE_LENGTH) {
        setError(`Title must be at most ${MAX_THREAD_TITLE_LENGTH} characters.`);
        return;
      }

      if (content.trim().length > MAX_THREAD_CONTENT_LENGTH) {
        setError(`Content must be at most ${MAX_THREAD_CONTENT_LENGTH} characters.`);
        return;
      }

      await onSave({ title, content });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '1.5rem' }}>
      <h3>Edit thread</h3>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_THREAD_TITLE_LENGTH}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={isSaving}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_THREAD_CONTENT_LENGTH}
          rows={8}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={isSaving}
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

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save changes'}
        </button>

        <button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
