import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ThreadForm } from '../features/threads/components/ThreadForm';
import { ThreadsList } from '../features/threads/components/ThreadList';
import { fetchThreads } from '../features/threads/api/threadsApi';
import type { Thread } from '../features/threads/types/thread.types';
import type { ThreadSort } from '../features/threads/api/threadsApi';
import { THREAD_PAGE_SIZE } from '../config/limits';

export function ThreadsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<ThreadSort>('active');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const mine = searchParams.get('mine') === 'true';

  async function loadThreads(options?: { mode?: 'replace' | 'append' }) {
    const mode = options?.mode ?? 'replace';
    const skip = mode === 'append' ? threads.length : 0;

    try {
      setError('');

      if (mode === 'append') {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }

      const data = await fetchThreads({
        search,
        sort,
        limit: THREAD_PAGE_SIZE,
        skip,
        mine,
      });

      setHasMore(data.length === THREAD_PAGE_SIZE);

      if (mode === 'append') {
        setThreads((prev) => [...prev, ...data]);
      } else {
        setThreads(data);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    loadThreads({ mode: 'replace' });
  }, [search, sort, mine]);

  useEffect(() => {
    const urlSearch = searchParams.get('search') ?? '';
    setSearchInput(urlSearch);
    setSearch(urlSearch);
  }, [searchParams]);

  useEffect(() => {
    if (!location.hash) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const target = document.querySelector(location.hash);

      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    }, 50);

    return () => window.clearTimeout(timeoutId);
  }, [location.hash]);

  async function handleThreadCreated() {
    await loadThreads({ mode: 'replace' });
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedSearch = searchInput.trim();
    const nextSearchParams = new URLSearchParams();

    if (normalizedSearch) {
      nextSearchParams.set('search', normalizedSearch);
    }

    if (mine) {
      nextSearchParams.set('mine', 'true');
    }

    setSearchParams(nextSearchParams);

    setSearch(normalizedSearch);
  }

  function handleClearSearch() {
    setSearchInput('');
    setSearch('');
    const nextSearchParams = new URLSearchParams();

    if (mine) {
      nextSearchParams.set('mine', 'true');
    }

    setSearchParams(nextSearchParams);
  }

  return (
    <main className="forum-page">
      <div className="forum-page__inner threads-page">
        <header className="forum-page__header">
          <div>
            <p className="forum-page__eyebrow">Forum index</p>
            <h1>{mine ? 'My threads' : 'Discussion threads'}</h1>
          </div>
        </header>

        {error && <p className="error-banner">{error}</p>}

        <section id="create-thread" className="forum-card threads-page__compose">
          <div className="card-heading">
            <div>
              <h2>Create thread</h2>
              <p className="card-heading__text">
                Start a discussion thread for evidence, debate, or AI-assisted review.
              </p>
            </div>
          </div>

          <ThreadForm onThreadCreated={handleThreadCreated} />
        </section>

        <section id="thread-list" className="forum-card threads-page__list">
          <div className="card-heading">
            <div>
              <h2>Thread list</h2>
              <p className="card-heading__text">
                Search, sort, and open the discussions you want to review.
              </p>
            </div>
          </div>

          <form className="thread-toolbar" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search threads by title or description..."
              className="thread-toolbar__search"
            />

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as ThreadSort)}
              className="thread-toolbar__sort"
            >
              <option value="active">Active</option>
              <option value="newest">Newest</option>
              <option value="popular">Popular</option>
            </select>

            <button type="submit">Search</button>

            {search && (
              <button type="button" className="button--ghost" onClick={handleClearSearch}>
                Clear
              </button>
            )}
          </form>

          {isLoading ? (
            <p className="forum-card__status">Loading threads...</p>
          ) : threads.length === 0 ? (
            <p className="forum-card__status">
              {mine ? 'You have not created any threads yet.' : 'No threads found.'}
            </p>
          ) : (
            <ThreadsList threads={threads} variant="grid" />
          )}

          {!isLoading && hasMore && (
            <div className="action-row" style={{ marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => loadThreads({ mode: 'append' })}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? 'Loading more...' : 'Load more'}
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
