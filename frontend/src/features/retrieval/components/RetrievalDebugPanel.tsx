import { useState } from 'react';
import { retrieveChunks } from '../api/retrievalApi';
import type { RetrievedChunk } from '../types/retrieval.types';

type RetrievalDebugPanelProps = {
  threadId: string;
  hasSources: boolean;
};

export function RetrievalDebugPanel({ threadId, hasSources }: RetrievalDebugPanelProps) {
  const [question, setQuestion] = useState('');
  const [chunks, setChunks] = useState<RetrievedChunk[]>([]);
  const [error, setError] = useState('');
  const [isRetrieving, setIsRetrieving] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      setError('Question is required.');
      return;
    }

    if (!hasSources) {
      setError('No evidence sources attached. Add sources before retrieval.');
      return;
    }

    try {
      setError('');
      setIsRetrieving(true);

      const result = await retrieveChunks(threadId, {
        question: normalizedQuestion,
        limit: 5,
      });

      setChunks(result);

      if (result.length === 0) {
        setError('No relevant chunks found for this question.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsRetrieving(false);
    }
  }

  return (
    <section className="forum-card retrieval-debug-panel">
      <h2>Retrieval debug</h2>

      <p className="card-heading__text">
        This does not call AI yet. It only shows which source chunks would be sent to the AI model
        later.
      </p>

      {error && <p className="error-banner">{error}</p>}

      <form className="retrieval-debug-panel__form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder="Ask a question to test retrieval..."
          className="panel-textarea"
          disabled={isRetrieving}
        />

        <button type="submit" disabled={isRetrieving}>
          {isRetrieving ? 'Retrieving...' : 'Retrieve chunks'}
        </button>
      </form>

      {chunks.length > 0 && (
        <div className="retrieval-debug-panel__results">
          <h3>Retrieved chunks</h3>

          {chunks.map((chunk) => (
            <article key={chunk.chunkId} className="retrieval-debug-panel__chunk">
              <div className="retrieval-debug-panel__meta">
                <strong>{chunk.sourceTitle}</strong>
                <br />
                <small>Chunk #{chunk.chunkIndex}</small>
                <br />
                <small>Score: {chunk.score.toFixed(4)}</small>
              </div>

              <p className="retrieval-debug-panel__text">{chunk.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
