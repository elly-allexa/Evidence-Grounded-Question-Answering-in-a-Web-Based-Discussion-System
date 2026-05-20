import type { GroundedAiAnswer } from '../types/ai.types';
import { SafeMarkdown } from '../../markdown/components/SafeMarkdown';

type AiAnswerListProps = {
  answers: GroundedAiAnswer[];
};

export function AiAnswerList({ answers }: AiAnswerListProps) {
  if (answers.length === 0) {
    return <p className="forum-card__status forum-card__status--compact">No AI answers yet.</p>;
  }

  return answers.map((answer) => (
    <article key={answer.id} className="ai-answer-card">
      <div className="ai-answer-card__section">
        <p className="label-text">Question</p>
        <p className="ai-answer-card__question">{answer.question}</p>
      </div>

      <div className="ai-answer-card__section">
        <p className="label-text">AI answer</p>
        <div className="ai-answer-card__answer">
          <SafeMarkdown content={answer.answer} />
        </div>
      </div>

      <div className="ai-answer-card__meta">
        <span>Provider: {answer.provider}</span>
        <span>Model: {answer.model}</span>
        <span>Used chunks: {answer.usedChunkCount}</span>
        <span>Created: {new Date(answer.createdAt).toLocaleString()}</span>
      </div>

      <details className="ai-answer-card__citations">
        <summary>Citations ({answer.citations.length})</summary>

        <div className="ai-answer-card__citation-list">
          {answer.citations.map((citation, index) => (
            <article key={citation.id ?? citation.chunkId} className="citation-card">
              <strong>
                [{index + 1}] {citation.sourceTitle}
              </strong>
              <small>Chunk #{citation.chunkIndex}</small>
              <div className="citation-card__quote">
                <SafeMarkdown content={citation.quote} />
              </div>
            </article>
          ))}
        </div>
      </details>
    </article>
  ));
}
