import type { Comment } from '../types/comment.types';

type CommentListProps = {
  comments: Comment[];
};

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return <p>No replies yet.</p>;
  }

  return (
    <section style={{ marginTop: '2rem' }}>
      <h3>Replies</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {comments.map((comment) => (
          <article
            key={comment.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            <p style={{ marginBottom: '0.75rem' }}>{comment.content}</p>

            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              <small>Author ID: {comment.authorId}</small>
              <br />
              <small>Posted: {new Date(comment.createdAt).toLocaleString()}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
