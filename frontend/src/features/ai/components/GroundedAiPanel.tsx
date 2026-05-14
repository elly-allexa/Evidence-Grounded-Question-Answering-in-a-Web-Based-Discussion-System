import { useState } from 'react';
import { DEFAULT_AI_RETRIEVAL_LIMIT, MAX_AI_QUESTION_LENGTH } from '../../../config/limits';
import { createGroundedAiAnswer } from '../api/aiApi';
import type { GroundedAiAnswer } from '../types/ai.types';

type GroundedAiPanelProps = {
  threadId: string;
  hasSources: boolean;
};

export function GroundedAiPanel({ threadId, hasSources }: GroundedAiPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<GroundedAiAnswer | null>(null);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedQuestion = question.trim();

    if (!normalizedQuestion) {
      setError('Question is required.');
      return;
    }

    if (normalizedQuestion.length > MAX_AI_QUESTION_LENGTH) {
      setError(`Question must be at most ${MAX_AI_QUESTION_LENGTH} characters.`);
      return;
    }

    if (!hasSources) {
      setError('No evidence sources attached. Add sources before asking AI.');
      return;
    }

    try {
      setError('');
      setAnswer(null);
      setIsGenerating(true);

      const result = await createGroundedAiAnswer(threadId, {
        question: normalizedQuestion,
        limit: DEFAULT_AI_RETRIEVAL_LIMIT,
      });

      setAnswer(result);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsGenerating(false);
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
      <h2>Ask AI from evidence</h2>

      <p style={{ color: '#555' }}>
        The AI answer is generated only from the attached source chunks. If the sources do not
        contain enough information, the AI should say so.
      </p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_AI_QUESTION_LENGTH}
          rows={4}
          placeholder="Ask a question about the attached sources..."
          style={{
            width: '100%',
            padding: '0.75rem',
            boxSizing: 'border-box',
            marginBottom: '0.5rem',
            resize: 'vertical',
          }}
          disabled={isGenerating}
        />

        <div style={{ textAlign: 'right', fontSize: '0.85rem', color: '#666' }}>
          {question.length}/{MAX_AI_QUESTION_LENGTH}
        </div>

        <button type="submit" disabled={isGenerating}>
          {isGenerating ? 'Generating answer...' : 'Ask AI'}
        </button>
      </form>

      {answer && (
        <div style={{ marginTop: '1.5rem' }}>
          <h3>AI answer</h3>

          <p style={{ whiteSpace: 'pre-wrap' }}>{answer.answer}</p>

          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            <small>Provider: {answer.provider}</small>
            <br />
            <small>Model: {answer.model}</small>
            <br />
            <small>Used chunks: {answer.usedChunkCount}</small>
          </div>

          <h4>Citations</h4>

          {answer.citations.map((citation, index) => (
            <article
              key={citation.chunkId}
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              <strong>
                [{index + 1}] {citation.sourceTitle}
              </strong>
              <br />
              <small>Chunk #{citation.chunkIndex}</small>
              <p style={{ whiteSpace: 'pre-wrap' }}>{citation.quote}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
