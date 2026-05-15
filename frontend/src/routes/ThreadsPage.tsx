import { useEffect, useState } from 'react';
import { ThreadForm } from '../features/threads/components/ThreadForm';
import { ThreadsList } from '../features/threads/components/ThreadList';
import { fetchThreads } from '../features/threads/api/threadsApi';
import type { Thread } from '../features/threads/types/thread.types';

export function ThreadsPage() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [error, setError] = useState('');

  async function loadThreads() {
    try {
      setError('');
      const data = await fetchThreads();
      setThreads(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    }
  }

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <main className="forum-page">
      <div className="forum-page__inner threads-page">
        <header className="forum-page__header">
          <div>
            <p className="forum-page__eyebrow">Forum index</p>
            <h1>Threads</h1>
          </div>
        </header>

        {error && <p className="error-banner">{error}</p>}

        <section className="forum-card threads-page__compose">
          <div className="card-heading">
            <div>
              <h2>Create thread</h2>
              <p className="card-heading__text">
                Start a discussion thread for evidence, debate, or AI-assisted review.
              </p>
            </div>
          </div>

          <ThreadForm onThreadCreated={loadThreads} />
        </section>

        <section className="forum-card threads-page__list">
          <div className="card-heading">
            <div>
              <h2>Thread list</h2>
              <p className="card-heading__text">
                Browse ongoing discussions and open the ones you want to review.
              </p>
            </div>
          </div>

          <ThreadsList threads={threads} />
        </section>
      </div>
    </main>
  );
}
