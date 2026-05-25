import { Link } from 'react-router-dom';
import type { Thread } from '../types/thread.types';

type ThreadsListProps = {
  threads: Thread[];
  variant?: 'grid' | 'feed';
};

function truncateContent(content: string, maxLength: number = 160): string {
  if (content.length <= maxLength) {
    return content;
  }

  return `${content.substring(0, maxLength)}...`;
}

export function ThreadsList({ threads, variant = 'grid' }: ThreadsListProps) {
  if (threads.length === 0) {
    return <p className="forum-card__status forum-card__status--compact">No threads found.</p>;
  }

  return (
    <div className={`thread-list thread-list--${variant}`}>
      <ul className="thread-list__items">
        {threads.map((thread) => (
          <li key={thread.id} className="thread-card">
            <Link className="thread-card__title" to={`/threads/${thread.id}`}>
              <h3>{thread.title}</h3>
            </Link>

            <p className="thread-card__preview">{truncateContent(thread.content)}</p>

            <div className="thread-card__meta">
              {thread.author ? (
                <span>By @{thread.author.username}</span>
              ) : (
                <span>By unknown</span>
              )}

              <span>Created: {new Date(thread.createdAt).toLocaleDateString()}</span>

              <span>{thread._count?.comments ?? 0} comments</span>

              <span>{thread._count?.sources ?? 0} sources</span>

              <span>{thread._count?.aiAnswers ?? 0} AI answers</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
