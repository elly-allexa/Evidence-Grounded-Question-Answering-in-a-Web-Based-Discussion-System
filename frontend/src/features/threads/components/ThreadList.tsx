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
    return <p className="forum-card__status forum-card__status--compact">No threads yet!</p>;
  }

  return (
    <div className="thread-list">
      <ul className="thread-list__items">
        {threads.map((thread) => (
          <li key={thread.id} className="thread-card">
            <Link className="thread-card__title" to={`/threads/${thread.id}`}>
              <h3>{thread.title}</h3>
            </Link>

            <p className="thread-card__preview">{truncateContent(thread.content)}</p>

            <div className="thread-card__meta">
              {'author' in thread && thread.author ? (
                <span>By @{thread.author.username}</span>
              ) : (
                <span>By unknown</span>
              )}
              <span>Created: {new Date(thread.createdAt).toLocaleDateString()}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
