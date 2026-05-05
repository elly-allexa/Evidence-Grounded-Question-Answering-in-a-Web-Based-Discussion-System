import { deleteSource } from '../api/sourcesApi';
import type { SourceDocument } from '../types/source.types';

type SourceListProps = {
  sources: SourceDocument[];
  canManageSources: boolean;
  onSourceDeleted: (sourceId: string) => void;
};

function truncateText(text: string, maxLength = 300): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export function SourceList({ sources, canManageSources, onSourceDeleted }: SourceListProps) {
  async function handleDelete(sourceId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this source?');

    if (!confirmed) {
      return;
    }

    await deleteSource(sourceId);
    onSourceDeleted(sourceId);
  }

  if (sources.length === 0) {
    return <p>No sources attached yet.</p>;
  }

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3>Attached sources</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {sources.map((source) => (
          <article
            key={source.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <h4>{source.title}</h4>

            <div style={{ color: '#666', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
              <small>Type: {source.type}</small>
              <br />
              <small>Created: {new Date(source.createdAt).toLocaleString()}</small>
            </div>

            <p style={{ whiteSpace: 'pre-wrap' }}>{truncateText(source.contentText)}</p>

            {canManageSources && (
              <button type="button" onClick={() => handleDelete(source.id)}>
                Delete source
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
