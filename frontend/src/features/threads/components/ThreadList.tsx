import { Link } from 'react-router-dom';
import type { Thread } from '../types/thread.types';

type ThreadsListProps = {
  threads: Thread[];
};

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

            <p>{thread.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}