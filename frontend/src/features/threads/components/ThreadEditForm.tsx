import { useState } from 'react';

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
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={isSaving}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          rows={8}
          style={{ width: '100%', padding: '0.5rem' }}
          disabled={isSaving}
        />
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
