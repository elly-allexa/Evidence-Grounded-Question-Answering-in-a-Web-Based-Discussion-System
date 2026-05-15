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
    <form className="thread-form thread-form--edit" onSubmit={handleSubmit}>
      <h3>Edit thread</h3>

      {error && <p className="error-banner">{error}</p>}

      <div className="thread-form__field">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={MAX_THREAD_TITLE_LENGTH}
          className="thread-form__input"
          disabled={isSaving}
        />
      </div>

      <div className="thread-form__field">
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_THREAD_CONTENT_LENGTH}
          rows={8}
          className="thread-form__textarea"
          disabled={isSaving}
        />
        <div className="field-meta">
          {content.length}/{MAX_THREAD_CONTENT_LENGTH}
        </div>
      </div>

      <div className="action-row">
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
