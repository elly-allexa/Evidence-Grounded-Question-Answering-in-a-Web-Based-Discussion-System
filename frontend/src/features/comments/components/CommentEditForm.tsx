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
    <form onSubmit={handleSubmit} style={{ marginTop: '0.75rem' }}>
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <textarea
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        maxLength={3000}
        style={{
          width: '100%',
          padding: '0.5rem',
          marginBottom: '0.5rem',
          resize: 'vertical',
          minHeight: '100px',
          maxHeight: '260px',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
        disabled={isSaving}
      />

      <div style={{ marginBottom: '0.75rem', color: '#666', fontSize: '0.9rem' }}>
        {content.length}/3000 characters
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
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
