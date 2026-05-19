import { useState } from 'react';
import { MAX_SOURCE_CONTENT_LENGTH, MAX_SOURCE_TITLE_LENGTH } from '../../../config/limits';
import { createSource } from '../api/sourcesApi';
import type { SourceDocument, SourceType } from '../types/source.types';

type SourceFormProps = {
  threadId: string;
  onSourceCreated: (source: SourceDocument) => void;
};

export function SourceForm({ threadId, onSourceCreated }: SourceFormProps) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<SourceType>('text');
  const [contentText, setContentText] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedTitle = title.trim();
    const normalizedContent = contentText.trim();

    if (!normalizedTitle || !normalizedContent) {
      setError('Source title and content are required.');
      return;
    }

    if (normalizedTitle.length > MAX_SOURCE_TITLE_LENGTH) {
      setError(`Source title must be at most ${MAX_SOURCE_TITLE_LENGTH} characters.`);
      return;
    }

    if (normalizedContent.length > MAX_SOURCE_CONTENT_LENGTH) {
      setError(`Source text must be at most ${MAX_SOURCE_CONTENT_LENGTH} characters.`);
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);

      const newSource = await createSource(threadId, {
        title: normalizedTitle,
        type,
        contentText: normalizedContent,
      });

      setTitle('');
      setType('text');
      setContentText('');
      onSourceCreated(newSource);
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
    <form
      onSubmit={handleSubmit}
      style={{
        marginTop: '2rem',
        border: '1px solid #ddd',
        borderRadius: '8px',
        padding: '1rem',
      }}
    >
      <h3>Attach source</h3>

      <p style={{ color: '#555' }}>
        Add text or markdown material that AI will later use as evidence.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Source title"
          value={title}
          maxLength={MAX_SOURCE_TITLE_LENGTH}
          onChange={(event) => setTitle(event.target.value)}
          style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          disabled={isSubmitting}
        />

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
          {title.length}/{MAX_SOURCE_TITLE_LENGTH}
        </div>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <select
          value={type}
          onChange={(event) => setType(event.target.value as SourceType)}
          disabled={isSubmitting}
          style={{ padding: '0.5rem' }}
        >
          <option value="text">Text</option>
          <option value="markdown">Markdown</option>
        </select>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <textarea
          placeholder="Paste source text here..."
          value={contentText}
          maxLength={MAX_SOURCE_CONTENT_LENGTH}
          onChange={(event) => setContentText(event.target.value)}
          rows={10}
          style={{
            width: '100%',
            padding: '0.75rem',
            resize: 'vertical',
            minHeight: '180px',
            maxHeight: '420px',
            overflowY: 'auto',
            boxSizing: 'border-box',
          }}
          disabled={isSubmitting}
        />

        <div
          style={{
            textAlign: 'right',
            fontSize: '0.85rem',
            color: contentText.length > MAX_SOURCE_CONTENT_LENGTH ? 'red' : '#666',
          }}
        >
          {contentText.length}/{MAX_SOURCE_CONTENT_LENGTH}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving source...' : 'Attach source'}
      </button>
    </form>
  );
}
