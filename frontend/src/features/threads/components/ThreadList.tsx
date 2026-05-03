import { Link } from 'react-router-dom';
import type { Thread } from '../types/thread.types';

type ThreadsListProps = {
  threads: Thread[];
};

function truncateContent(content: string, maxLength: number = 100): string {
  if (content.length <= maxLength) {
    return content;
  }
  return content.substring(0, maxLength) + '...';
}

export function ThreadsList({ threads }: ThreadsListProps) {
  if (threads.length === 0) {
    return <p>No threads yet!</p>;
  }

  return (
    <div>
      <h2>Threads</h2>

      <ul style={{ padding: 0, listStyle: 'none' }}>
        {threads.map((thread) => (
          <li
            key={thread.id}
            style={{
              border: '1px solid #ccc',
              padding: '1rem',
              marginBottom: '1rem',
              borderRadius: '8px',
            }}
          >
            <Link to={`/threads/${thread.id}`}>
              <h3>{thread.title}</h3>
            </Link>

            <p style={{ marginBottom: '0.5rem', color: '#333' }}>
              {truncateContent(thread.content)}
            </p>

            <div style={{ color: '#666', fontSize: '0.9rem' }}>
              {'author' in thread && thread.author ? (
                <small>By @{thread.author.username}</small>
              ) : (
                <small>By unknown</small>
              )}
              <br />
              <small>Created: {new Date(thread.createdAt).toLocaleDateString()}</small>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
