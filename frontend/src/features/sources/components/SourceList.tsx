import { useEffect, useState } from 'react';
import { deleteSource } from '../api/sourcesApi';
import type { SourceDocument } from '../types/source.types';
import { SafeMarkdown } from '../../markdown/components/SafeMarkdown';

type SourceListProps = {
  sources: SourceDocument[];
  canManageSources: boolean;
  onSourceDeleted: (sourceId: string) => void;
};

const PREVIEW_LENGTH = 420;

function truncateText(text: string, maxLength = PREVIEW_LENGTH): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength)}...`;
}

export function SourceList({ sources, canManageSources, onSourceDeleted }: SourceListProps) {
  const [expandedSourceIds, setExpandedSourceIds] = useState<Set<string>>(new Set());
  const [sourceErrors, setSourceErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const errorIds = Object.keys(sourceErrors);

    if (errorIds.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setSourceErrors({});
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [sourceErrors]);

  async function handleDelete(sourceId: string) {
    const confirmed = window.confirm('Are you sure you want to delete this source?');

    if (!confirmed) {
      return;
    }

    try {
      setSourceErrors((prev) => {
        const next = { ...prev };
        delete next[sourceId];
        return next;
      });

      await deleteSource(sourceId);
      onSourceDeleted(sourceId);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error
          ? deleteError.message
          : 'Could not delete this source. Please try again.';

      setSourceErrors((prev) => ({
        ...prev,
        [sourceId]: message.includes('AI answer')
          ? 'Evidence is locked after an AI answer has been generated. This protects saved citations and answer reproducibility.'
          : message,
      }));
    }
  }

  function togglePreview(sourceId: string) {
    setExpandedSourceIds((prev) => {
      const next = new Set(prev);

      if (next.has(sourceId)) {
        next.delete(sourceId);
      } else {
        next.add(sourceId);
      }

      return next;
    });
  }

  if (sources.length === 0) {
    return (
      <p className="forum-card__status forum-card__status--compact">No sources attached yet.</p>
    );
  }

  return (
    <div className="source-list">
      <div className="source-list__items">
        {sources.map((source) => {
          const isExpanded = expandedSourceIds.has(source.id);
          const hasOverflow = source.contentText.length > PREVIEW_LENGTH;
          const sourceError = sourceErrors[source.id];
          const isDeleted = Boolean(source.isDeleted);
          const displayTitle = isDeleted ? 'Removed source' : source.title;
          const displayContent = isDeleted
            ? source.deletionReason?.trim() || source.contentText
            : source.contentText;

          return (
            <article
              key={source.id}
              className={`source-card ${isDeleted ? 'source-card--removed' : ''}`}
            >
              <div className="source-card__header">
                <div>
                  <h3>{displayTitle}</h3>
                  <div className="source-card__meta">
                    <span>Type: {source.type}</span>
                    <span>Created: {new Date(source.createdAt).toLocaleString()}</span>
                    {isDeleted && source.deletedAt && (
                      <span>Removed: {new Date(source.deletedAt).toLocaleString()}</span>
                    )}
                    <span>Chunks: {source._count?.chunks ?? 0}</span>
                  </div>
                </div>

                {hasOverflow && !isDeleted && (
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
                <SafeMarkdown
                  content={isExpanded ? displayContent : truncateText(displayContent)}
                />
              </div>

              {sourceError && <p className="error-banner">{sourceError}</p>}

              {canManageSources && !isDeleted && (
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
