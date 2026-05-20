import { useState } from 'react';
import { DEFAULT_AI_RETRIEVAL_LIMIT, MAX_AI_QUESTION_LENGTH } from '../../../config/limits';
import { createGroundedAiAnswer } from '../api/aiApi';
import type { GroundedAiAnswer } from '../types/ai.types';

type GroundedAiPanelProps = {
  threadId: string;
  hasSources: boolean;
  canAskAi: boolean;
  onAnswerCreated: (answer: GroundedAiAnswer) => void;
};

export function GroundedAiPanel({
  threadId,
  hasSources,
  canAskAi,
  onAnswerCreated,
}: GroundedAiPanelProps) {
  const [question, setQuestion] = useState('');
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

    if (!canAskAi) {
      setError('Only the thread author can ask AI questions for this thread.');
      return;
    }

    try {
      setError('');
      setIsGenerating(true);

      const result = await createGroundedAiAnswer(threadId, {
        question: normalizedQuestion,
        limit: DEFAULT_AI_RETRIEVAL_LIMIT,
      });

      onAnswerCreated(result);
      setQuestion('');
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
    <section className="ai-panel">
      <div className="card-heading">
        <div>
          <h2>Ask AI from evidence</h2>
          <p className="card-heading__text">
            The answer is generated only from the attached source chunks. If the sources do not
            contain enough information, the AI should say so.
          </p>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      <form className="ai-panel__form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={MAX_AI_QUESTION_LENGTH}
          rows={4}
          placeholder="Ask a question about the attached sources..."
          className="panel-textarea"
          disabled={isGenerating || !canAskAi}
          aria-describedby="ai-question-status"
        />

        <div className="field-meta">
          {question.length}/{MAX_AI_QUESTION_LENGTH}
        </div>

        <div className="action-row action-row--spread">
          <p className="forum-card__status forum-card__status--compact" id="ai-question-status">
            {!canAskAi
              ? 'Only the thread author can ask AI questions.'
              : hasSources
                ? 'Ask a question grounded in the attached evidence.'
                : 'Add sources before asking AI.'}
          </p>

          <button type="submit" disabled={isGenerating || !hasSources || !canAskAi}>
            {isGenerating ? 'Generating answer...' : 'Ask AI'}
          </button>
        </div>

        {isGenerating && <p className="forum-card__status">Generating grounded answer...</p>}
      </form>
    </section>
  );
}
