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
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Threads</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <ThreadForm onThreadCreated={loadThreads} />
      <ThreadsList threads={threads} />
    </main>
  );
}
