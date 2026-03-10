import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchThreadsById } from '../features/threads/api/threadsApi';
import type { Thread } from '../features/threads/types/thread.types';

export function ThreadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadThread() {
      if (!id) {
        return;
      }

      try {
        setError('');
        const data = await fetchThreadsById(id);
        setThread(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      }
    }

    loadThread();
  }, [id]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>Thread details</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!thread ? (
        <p>Loading...</p>
      ) : (
        <article>
          <h2>{thread.title}</h2>
          <p>{thread.content}</p>
          <small>Author ID: {thread.authorId}</small>
        </article>
      )}
    </main>
  );
}
