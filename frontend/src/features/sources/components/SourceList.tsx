import { useState } from 'react';
import { deleteSource } from '../api/sourcesApi';
import type { SourceDocument } from '../types/source.types';
import { SafeMarkdown } from '../../markdown/components/SafeMarkdown';

type SourceListProps = {
  sources: SourceDocument[];
  canManageSources: boolean;
  onSourceDeleted: (sourceId: string) => void;
};

const PREVIEW_LENGTH = 280;

function truncateText(text: string, maxLength = PREVIEW_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

function getDeleteErrorMessage(error: unknown): string {
  const fallback = 'Failed to delete source. Please try again.';

  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error.message.includes('Sources cannot be deleted after an AI answer has been generated.')) {
    return 'This source cannot be deleted because the thread already has an AI answer. Remove the answer history first if you need to change the evidence set.';
  }

  return error.message || fallback;
}

export function SourceList({ sources, canManageSources, onSourceDeleted }: SourceListProps) {
  const [expandedSourceIds, setExpandedSourceIds] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  async function handleDelete(sourceId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this source?');

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      await deleteSource(sourceId);
      onSourceDeleted(sourceId);
    } catch (deleteError) {
      setError(getDeleteErrorMessage(deleteError));
    }
  }

  function togglePreview(sourceId: string) {
    setExpandedSourceIds((prev) => ({
      ...prev,
      [sourceId]: !prev[sourceId],
    }));
  }

  if (sources.length === 0) {
    return (
      <p className="forum-card__status forum-card__status--compact">No sources attached yet.</p>
    );
  }

  return (
    <div className="source-list">
      {error && <p className="error-banner">{error}</p>}

      <div className="source-list__items">
        {sources.map((source) => {
          const isExpanded = expandedSourceIds[source.id] ?? false;
          const hasOverflow = source.contentText.length > PREVIEW_LENGTH;

          return (
            <article key={source.id} className="source-card">
              <div className="source-card__header">
                <div>
                  <h3>{source.title}</h3>
                  <div className="source-card__meta">
                    <span>Type: {source.type}</span>
                    <span>Created: {new Date(source.createdAt).toLocaleString()}</span>
                    <span>Chunks: {source._count?.chunks ?? 0}</span>
                  </div>
                </div>

                {hasOverflow && (
                  <button
                    type="button"
                    className="button--ghost"
                    onClick={() => togglePreview(source.id)}
                  >
                    {isExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </div>

              <div
                className={`source-card__preview ${isExpanded ? 'source-card__preview--expanded' : ''}`}
              >
                <SafeMarkdown content={isExpanded ? source.contentText : truncateText(source.contentText)} />
              </div>

              {canManageSources && (
                <div className="source-card__actions">
                  <button type="button" onClick={() => handleDelete(source.id)}>
                    Delete source
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
