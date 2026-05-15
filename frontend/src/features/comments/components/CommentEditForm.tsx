import { useState } from 'react';

type CommentEditFormProps = {
  initialContent: string;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
};

export function CommentEditForm({ initialContent, onSave, onCancel }: CommentEditFormProps) {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedContent = content.trim();

    if (!normalizedContent) {
      setError('Comment content is required.');
      return;
    }

    try {
      setError('');
      setIsSaving(true);
      await onSave(normalizedContent);
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
    <form className="comment-form comment-form--edit" onSubmit={handleSubmit}>
      {error && <p className="error-banner">{error}</p>}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        maxLength={3000}
        className="comment-form__textarea"
        disabled={isSaving}
      />

      <div className="field-meta comment-form__meta">{content.length}/3000 characters</div>

      <div className="action-row">
        <button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save'}
        </button>

        <button type="button" onClick={onCancel} disabled={isSaving}>
          Cancel
        </button>
      </div>
    </form>
  );
}
