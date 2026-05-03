import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchThreadById, updateThread, deleteThread } from '../features/threads/api/threadsApi';
import type { Thread } from '../features/threads/types/thread.types';
import { ThreadEditForm } from '../features/threads/components/ThreadEditForm';
import { fetchCommentsByThreadId } from '../features/comments/api/commentsApi';
import type { Comment } from '../features/comments/types/comment.types';
import { CommentForm } from '../features/comments/components/CommentForm';
import { CommentList } from '../features/comments/components/CommentList';
import { CURRENT_DEMO_USER_ID } from '../config/demoUser';

const CURRENT_USER_ID = CURRENT_DEMO_USER_ID;

export function ThreadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  const [error, setError] = useState('');
  const [commentsError, setCommentsError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  async function loadThread() {
    if (!id) {
      setThread(null);
      setError('Missing thread id');
      setIsLoading(false);
      return;
    }

    try {
      setError('');
      setIsLoading(true);
      const data = await fetchThreadById(id);
      setThread(data);
    } catch (err) {
      setThread(null);

      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function loadComments() {
    if (!id) {
      setCommentsError('Missing thread id');
      setIsCommentsLoading(false);
      return;
    }

    try {
      setCommentsError('');
      setIsCommentsLoading(true);
      const data = await fetchCommentsByThreadId(id);
      setComments(data);
    } catch (err) {
      if (err instanceof Error) {
        setCommentsError(err.message);
      } else {
        setCommentsError('Unknown error');
      }
    } finally {
      setIsCommentsLoading(false);
    }
  }

  useEffect(() => {
    loadThread();
    loadComments();
  }, [id]);

  async function handleSave(data: { title: string; content: string }) {
    if (!id) {
      throw new Error('Missing thread id');
    }

    const updated = await updateThread(id, data);
    setThread(updated);
    setIsEditing(false);
  }

  async function handleDelete() {
    if (!id) {
      setError('Missing thread id');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to delete this thread?');

    if (!confirmed) {
      return;
    }

    try {
      setError('');
      setIsDeleting(true);
      await deleteThread(id);
      navigate('/threads');
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setIsDeleting(false);
    }
  }

  function handleCommentCreated(newComment: Comment) {
    setComments((prev) => [...prev, newComment]);
  }

  function handleCommentUpdated(updatedComment: Comment) {
    setComments((prev) =>
      prev.map((comment) => (comment.id === updatedComment.id ? updatedComment : comment)),
    );
  }

  function handleCommentDeleted(deletedCommentId: string, replacement?: Comment) {
    if (replacement) {
      setComments((prev) =>
        prev.map((comment) => (comment.id === deletedCommentId ? replacement : comment)),
      );
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== deletedCommentId));
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: '1rem' }}>
        <Link to="/threads">← Back to threads</Link>
      </div>

      <h1>Thread details</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      {isLoading ? (
        <p>Loading thread...</p>
      ) : !thread ? (
        <p>Thread not found.</p>
      ) : (
        <>
          <article
            style={{
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <h2>{thread.title}</h2>
            <p>{thread.content}</p>

            <div style={{ marginTop: '1rem', color: '#555' }}>
              {'author' in thread && thread.author ? (
                <small>Author: @{thread.author.username}</small>
              ) : (
                <small>Author: Unknown</small>
              )}
              <br />
              <small>Created: {new Date(thread.createdAt).toLocaleString()}</small>
              <br />
              <small>Updated: {new Date(thread.updatedAt).toLocaleString()}</small>
            </div>

            <div
              style={{
                marginTop: '1.5rem',
                display: 'flex',
                gap: '0.75rem',
              }}
            >
              {thread.authorId === CURRENT_USER_ID && (
                <>
                  <button type="button" onClick={() => setIsEditing((prev) => !prev)}>
                    {isEditing ? 'Close edit' : 'Edit thread'}
                  </button>

                  <button type="button" onClick={handleDelete} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete thread'}
                  </button>
                </>
              )}
            </div>

            {isEditing && thread.authorId === CURRENT_USER_ID && (
              <ThreadEditForm
                initialTitle={thread.title}
                initialContent={thread.content}
                onSave={handleSave}
                onCancel={() => setIsEditing(false)}
              />
            )}
          </article>

          <section>
            {commentsError && <p style={{ color: 'red' }}>{commentsError}</p>}

            {isCommentsLoading ? (
              <p>Loading replies...</p>
            ) : id ? (
              <CommentList
                threadId={id}
                comments={comments}
                onCommentCreated={handleCommentCreated}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
              />
            ) : (
              <p>Missing thread id.</p>
            )}

            {id && <CommentForm threadId={id} onCommentCreated={handleCommentCreated} />}
          </section>
        </>
      )}
    </main>
  );
}
