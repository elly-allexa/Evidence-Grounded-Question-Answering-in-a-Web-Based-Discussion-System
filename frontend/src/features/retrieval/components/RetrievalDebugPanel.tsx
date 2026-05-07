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
    <section
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1.5rem',
        marginBottom: '2rem',
      }}
    >
      <h2>Retrieval debug</h2>

      <p style={{ color: '#555' }}>
        This does not call AI yet. It only shows which source chunks would be sent to the AI model
        later.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          rows={3}
          placeholder="Ask a question to test retrieval..."
          style={{
            width: '100%',
            padding: '0.75rem',
            boxSizing: 'border-box',
            marginBottom: '0.75rem',
          }}
          disabled={isRetrieving}
        />

        <button type="submit" disabled={isRetrieving}>
          {isRetrieving ? 'Retrieving...' : 'Retrieve chunks'}
        </button>
      </form>

      {chunks.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>Retrieved chunks</h3>

          {chunks.map((chunk) => (
            <article
              key={chunk.chunkId}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ color: '#666', fontSize: '0.9rem' }}>
                <strong>{chunk.sourceTitle}</strong>
                <br />
                <small>Chunk #{chunk.chunkIndex}</small>
                <br />
                <small>Score: {chunk.score.toFixed(4)}</small>
              </div>

              <p style={{ whiteSpace: 'pre-wrap' }}>{chunk.text}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
