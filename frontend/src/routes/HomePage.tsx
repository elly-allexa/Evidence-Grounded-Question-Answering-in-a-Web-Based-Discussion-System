import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchThreads } from '../features/threads/api/threadsApi';
import type { Thread } from '../features/threads/types/thread.types';
import { ThreadsList } from '../features/threads/components/ThreadList';
import { HOME_FEED_THREAD_LIMIT } from '../config/limits';

export function HomePage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadHomeFeed() {
    try {
      setError('');
      setIsLoading(true);

      const data = await fetchThreads({
        sort: 'active',
        limit: HOME_FEED_THREAD_LIMIT,
        skip: 0,
      });

      setThreads(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHomeFeed();
  }, []);

  return (
    <main className="forum-page">
      <div className="forum-page__inner home-page">
        <section className="forum-card thread-hero home-page__hero">
          <p className="forum-page__eyebrow">Evidence-grounded forum</p>

          <h1>MakeSense AI Forum</h1>

          <p className="thread-hero__content">
            Evidence-grounded discussions with AI answers, source-backed citations, and ordinary
            forum replies in one place.
          </p>

          <div className="action-row" style={{ marginTop: '1.25rem' }}>
            <Link className="app-nav__link" to="/threads">
              Browse threads
            </Link>

            <Link className="app-nav__link" to="/threads">
              Start a discussion
            </Link>
          </div>
        </section>

        <section className="forum-card home-page__panel">
          <div className="card-heading">
            <div>
              <h2>Latest active threads</h2>
              <p className="card-heading__text">
                Recent discussions where users can attach evidence, ask grounded AI questions, and
                continue the conversation.
              </p>
            </div>

            <Link className="app-nav__link" to="/threads">
              View all
            </Link>
          </div>

          {error && <p className="error-banner">{error}</p>}

          {isLoading ? (
            <p className="forum-card__status">Loading active threads...</p>
          ) : (
            <ThreadsList threads={threads} />
          )}
        </section>
      </div>
    </main>
  );
}
