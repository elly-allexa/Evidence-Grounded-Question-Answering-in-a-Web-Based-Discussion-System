import { useEffect, useState } from 'react';
import { DEFAULT_AI_RETRIEVAL_LIMIT, MAX_AI_QUESTION_LENGTH } from '../../../config/limits';
import { enqueueGroundedAiAnswer, fetchMyAiLimits, type AiLimits } from '../api/aiApi';

type GroundedAiPanelProps = {
  threadId: string;
  hasSources: boolean;
  canAskAi: boolean;
  isSignedIn: boolean;
  onJobQueued?: () => void;
};

export function GroundedAiPanel({
  threadId,
  hasSources,
  canAskAi,
  isSignedIn,
  onJobQueued,
}: GroundedAiPanelProps) {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiLimits, setAiLimits] = useState<AiLimits | null>(null);

  const hasReachedAiLimit = aiLimits !== null && aiLimits.remaining <= 0;

  useEffect(() => {
    async function loadLimits() {
      const data = await fetchMyAiLimits();
      setAiLimits(data);
    }

    if (isSignedIn) {
      void loadLimits();
    }
  }, [isSignedIn]);

  useEffect(() => {
    if (!error && !status) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError('');
      setStatus('');
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [error, status]);

  function handleQuestionInputIntent() {
    if (!isSignedIn) {
      setError('Sign in to start a discussion and ask AI.');
      return;
    }

    if (!canAskAi) {
      setError('Only the thread author can ask AI questions for this thread.');
    }
  }

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

    if (hasReachedAiLimit) {
      setError(
        `Daily AI question limit reached. You used ${aiLimits?.limit ?? 0}/${aiLimits?.limit ?? 0} questions today.`,
      );
      return;
    }

    if (!canAskAi) {
      setError(
        !isSignedIn
          ? 'Sign in to start a discussion and ask AI.'
          : 'Only the thread author can ask AI questions for this thread.',
      );
      return;
    }

    try {
      setError('');
      setStatus('');
      setIsGenerating(true);

      const job = await enqueueGroundedAiAnswer(threadId, {
        question: normalizedQuestion,
        limit: DEFAULT_AI_RETRIEVAL_LIMIT,
      });

      setQuestion('');
      setStatus(`AI request queued. Status: ${job.status}.`);
      const updatedLimits = await fetchMyAiLimits();
      setAiLimits(updatedLimits);
      onJobQueued?.();
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
            contain enough information, the AI will say so.
          </p>
        </div>
      </div>

      {error && <p className="error-banner">{error}</p>}

      {status && <p className="forum-card__status">{status}</p>}

      {aiLimits && (
        <p className="forum-card__status forum-card__status--compact">
          AI questions today: {aiLimits.used}/{aiLimits.limit}
        </p>
      )}

      <form className="ai-panel__form" onSubmit={handleSubmit}>
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onFocus={handleQuestionInputIntent}
          onClick={handleQuestionInputIntent}
          maxLength={MAX_AI_QUESTION_LENGTH}
          rows={4}
          placeholder="Ask a question about the attached sources..."
          className="panel-textarea"
          disabled={isGenerating}
          readOnly={!canAskAi || hasReachedAiLimit}
          aria-describedby="ai-question-status"
        />

        <div className="field-meta">
          {question.length}/{MAX_AI_QUESTION_LENGTH}
        </div>

        <div className="action-row action-row--spread">
          <p className="forum-card__status forum-card__status--compact" id="ai-question-status">
            {!canAskAi
              ? !isSignedIn
                ? 'Sign in to start a discussion and ask AI.'
                : 'Only the thread author can ask AI questions.'
              : hasSources
                ? 'Ask a question grounded in the attached evidence.'
                : 'Add sources before asking AI.'}
          </p>

          <button
            type="submit"
            disabled={isGenerating || !hasSources || !canAskAi || hasReachedAiLimit}
          >
            {isGenerating ? 'Generating answer...' : 'Ask AI'}
          </button>
        </div>

        {isGenerating && <p className="forum-card__status">Generating grounded answer...</p>}
      </form>
    </section>
  );
}
