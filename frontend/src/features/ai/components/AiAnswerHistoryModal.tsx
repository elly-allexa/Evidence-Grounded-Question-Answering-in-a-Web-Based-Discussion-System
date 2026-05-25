import { useEffect } from 'react';
import type { GroundedAiAnswer } from '../types/ai.types';
import { AiAnswerList } from './AiAnswerList';

type AiAnswerHistoryModalProps = {
  answers: GroundedAiAnswer[];
  isLoading: boolean;
  error: string;
  onClose: () => void;
};

export function AiAnswerHistoryModal({ answers, isLoading, error, onClose }: AiAnswerHistoryModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={onClose}>
      <section className="modal-card ai-answer-modal" onMouseDown={(event) => event.stopPropagation()}>
        <div className="modal-card__header">
          <div>
            <h2>Previous AI answers</h2>
            <p className="card-heading__text">
              Saved responses include the original question, model answer, and citations.
            </p>
          </div>

          <button type="button" className="button--ghost" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-card__body">
          {error && <p className="error-banner">{error}</p>}

          {isLoading ? <p className="forum-card__status">Loading AI answers...</p> : <AiAnswerList answers={answers} />}
        </div>
      </section>
    </div>
  );
}
