import type { GroundedAiAnswer } from '../types/ai.types';

type AiAnswerListProps = {
  answers: GroundedAiAnswer[];
};

export function AiAnswerList({ answers }: AiAnswerListProps) {
  if (answers.length === 0) {
    return <p>No AI answers yet.</p>;
  }

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h3>Previous AI answers</h3>

      {answers.map((answer) => (
        <article
          key={answer.id}
          style={{
            border: '1px solid #ddd',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1rem',
          }}
        >
          <h4>Question</h4>
          <p>{answer.question}</p>

          <h4>AI answer</h4>
          <p style={{ whiteSpace: 'pre-wrap' }}>{answer.answer}</p>

          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            <small>Provider: {answer.provider}</small>
            <br />
            <small>Model: {answer.model}</small>
            <br />
            <small>Used chunks: {answer.usedChunkCount}</small>
            <br />
            <small>Created: {new Date(answer.createdAt).toLocaleString()}</small>
          </div>

          <h4>Citations</h4>

          {answer.citations.map((citation, index) => (
            <article
              key={citation.id ?? citation.chunkId}
              style={{
                border: '1px solid #eee',
                borderRadius: '8px',
                padding: '0.75rem',
                marginBottom: '0.75rem',
              }}
            >
              <strong>
                [{index + 1}] {citation.sourceTitle}
              </strong>
              <br />
              <small>Chunk #{citation.chunkIndex}</small>
              <p>{citation.quote}</p>
            </article>
          ))}
        </article>
      ))}
    </section>
  );
}
