import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { fetchThreadById, updateThread, deleteThread } from '../features/threads/api/threadsApi';
import type { Thread } from '../features/threads/types/thread.types';
import { ThreadEditForm } from '../features/threads/components/ThreadEditForm';
import { fetchCommentsByThreadId } from '../features/comments/api/commentsApi';
import type { Comment, DeleteCommentResult } from '../features/comments/types/comment.types';
import { CommentForm } from '../features/comments/components/CommentForm';
import { CommentList } from '../features/comments/components/CommentList';
import { MAX_SOURCES_PER_THREAD } from '../config/limits';
import { fetchSourcesByThreadId } from '../features/sources/api/sourcesApi';
import type { SourceDocument } from '../features/sources/types/source.types';
import { SourceForm } from '../features/sources/components/SourceForm';
import { PdfSourceForm } from '../features/sources/components/PdfSourceForm';
import { SourceList } from '../features/sources/components/SourceList';
import { RetrievalDebugPanel } from '../features/retrieval/components/RetrievalDebugPanel';
import { GroundedAiPanel } from '../features/ai/components/GroundedAiPanel';
import { fetchAiAnswersByThreadId } from '../features/ai/api/aiApi';
import type { GroundedAiAnswer } from '../features/ai/types/ai.types';
import { AiAnswerHistoryModal } from '../features/ai/components/AiAnswerHistoryModal';
import { AiJobStatusPanel } from '../features/ai/components/AiJobStatusPanel';
import { fetchMe, type UserProfile } from '../features/auth/api/authApi';
import { getDisplayUsername } from '../utils/displayUser';
import { UserAvatar } from '../features/users/components/UserAvatar';

const SHOW_RETRIEVAL_DEBUG_PANEL = false;

export function ThreadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [thread, setThread] = useState<Thread | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [sources, setSources] = useState<SourceDocument[]>([]);
  const [aiAnswers, setAiAnswers] = useState<GroundedAiAnswer[]>([]);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const [error, setError] = useState('');
  const [commentsError, setCommentsError] = useState('');
  const [sourcesError, setSourcesError] = useState('');
  const [aiAnswersError, setAiAnswersError] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isCommentsLoading, setIsCommentsLoading] = useState(true);
  const [isSourcesLoading, setIsSourcesLoading] = useState(true);
  const [isAiAnswersLoading, setIsAiAnswersLoading] = useState(true);

  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAiAnswersModalOpen, setIsAiAnswersModalOpen] = useState(false);
  const isThreadOwner = thread?.authorId === currentUser?.id;
  const isAdmin = currentUser?.role === 'ADMIN';
  const activeSourceCount = sources.filter((source) => !source.isDeleted).length;

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

  async function loadSources() {
    if (!id) {
      setSourcesError('Missing thread id');
      setIsSourcesLoading(false);
      return;
    }

    try {
      setSourcesError('');
      setIsSourcesLoading(true);

      const data = await fetchSourcesByThreadId(id);
      setSources(data);
    } catch (err) {
      if (err instanceof Error) {
        setSourcesError(err.message);
      } else {
        setSourcesError('Unknown error');
      }
    } finally {
      setIsSourcesLoading(false);
    }
  }

  async function loadAiAnswers() {
    if (!id) {
      setAiAnswersError('Missing thread id');
      setIsAiAnswersLoading(false);
      return;
    }

    try {
      setAiAnswersError('');
      setIsAiAnswersLoading(true);

      const data = await fetchAiAnswersByThreadId(id);
      setAiAnswers(data);
    } catch (err) {
      if (err instanceof Error) {
        setAiAnswersError(err.message);
      } else {
        setAiAnswersError('Unknown error');
      }
    } finally {
      setIsAiAnswersLoading(false);
    }
  }

  useEffect(() => {
    loadThread();
    loadComments();
    loadSources();
    loadAiAnswers();
  }, [id]);

  useEffect(() => {
    if (!id || !currentUser || isAiAnswersModalOpen) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadAiAnswers();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [id, currentUser, isAiAnswersModalOpen]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentUser() {
      try {
        const profile = await fetchMe();

        if (!cancelled) {
          setCurrentUser(profile);
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null);
        }
      }
    }

    void loadCurrentUser();

    return () => {
      cancelled = true;
    };
  }, []);

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

  function handleCommentDeleted(result: DeleteCommentResult) {
    if (result.mode === 'hard') {
      setComments((prev) =>
        prev.filter((comment) => !result.deletedCommentIds.includes(comment.id)),
      );
      return;
    }

    setComments((prev) =>
      prev.map((comment) => (comment.id === result.comment.id ? result.comment : comment)),
    );
  }

  function handleSourceCreated(newSource: SourceDocument) {
    setSources((prev) => [newSource, ...prev]);
    void loadThread();
  }

  function handleSourceDeleted(_sourceId: string) {
    void loadSources();
    void loadThread();
  }

  return (
    <main className="forum-page">
      <div className="forum-page__inner">
        <div className="forum-page__backlink">
          <Link to="/threads#thread-list">← Back to threads</Link>
        </div>

        <header className="forum-page__header">
          <div>
            <p className="forum-page__eyebrow">Thread discussion</p>
            <h1>Thread details</h1>
          </div>
        </header>

        {error && <p className="error-banner">{error}</p>}

        {isLoading ? (
          <div className="forum-card forum-card--empty">Loading thread...</div>
        ) : !thread ? (
          <div className="forum-card forum-card--empty">Thread not found.</div>
        ) : (
          <div className="thread-layout">
            <div className="thread-layout__main">
              <article className="forum-card thread-hero">
                <div className="thread-hero__header">
                  <div>
                    <h2>{thread.title}</h2>

                    <p className="thread-hero__meta">
                      {'author' in thread && thread.author ? (
                        <Link
                          className="user-inline-link thread-hero__author-link"
                          to={`/users/${encodeURIComponent(getDisplayUsername(thread.author))}`}
                        >
                          <UserAvatar
                            username={getDisplayUsername(thread.author)}
                            avatarUrl={thread.author.avatarUrl}
                            size="sm"
                          />
                          <strong>@{getDisplayUsername(thread.author)}</strong>
                        </Link>
                      ) : (
                        <span>Unknown author</span>
                      )}

                      <span>Created {new Date(thread.createdAt).toLocaleString()}</span>
                      <span>Updated {new Date(thread.updatedAt).toLocaleString()}</span>
                    </p>
                  </div>

                  {(isThreadOwner || isAdmin) && (
                    <div className="thread-hero__actions">
                      {isThreadOwner && (
                        <button type="button" onClick={() => setIsEditing((prev) => !prev)}>
                          {isEditing ? 'Close edit' : 'Edit thread'}
                        </button>
                      )}

                      <button type="button" onClick={handleDelete} disabled={isDeleting}>
                        {isDeleting ? 'Deleting...' : 'Delete thread'}
                      </button>
                    </div>
                  )}
                </div>

                <p className="thread-hero__content">{thread.content}</p>

                {isEditing && isThreadOwner && (
                  <div className="thread-hero__editor">
                    <ThreadEditForm
                      initialTitle={thread.title}
                      initialContent={thread.content}
                      onSave={handleSave}
                      onCancel={() => setIsEditing(false)}
                    />
                  </div>
                )}
              </article>

              <section className="forum-card">
                <div className="card-heading">
                  <div>
                    <h2>Evidence sources</h2>
                    <p className="card-heading__text">
                      Attached source text is used for grounded AI answers and citations.
                    </p>
                  </div>
                </div>

                {sourcesError && <p className="error-banner">{sourcesError}</p>}

                {isSourcesLoading ? (
                  <div className="forum-card__status">Loading sources...</div>
                ) : (
                  <SourceList
                    sources={sources}
                    canManageSources={Boolean(isThreadOwner || isAdmin)}
                    onSourceDeleted={handleSourceDeleted}
                  />
                )}

                {id && isThreadOwner && (
                  <div className="forum-card__subsection">
                    {activeSourceCount >= MAX_SOURCES_PER_THREAD ? (
                      <p className="forum-card__status">
                        Source limit reached. A thread can have at most {MAX_SOURCES_PER_THREAD}{' '}
                        evidence sources.
                      </p>
                    ) : (
                      <>
                        <SourceForm threadId={id} onSourceCreated={handleSourceCreated} />
                        <div className="forum-card__subsection">
                          <PdfSourceForm threadId={id} onSourceCreated={handleSourceCreated} />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </section>

              <section className="forum-card">
                <div className="card-heading">
                  <div>
                    <h2>Comments</h2>
                    <p className="card-heading__text">
                      Discussion and replies stay close to the thread so they are easy to review.
                    </p>
                  </div>
                </div>

                {commentsError && <p className="error-banner">{commentsError}</p>}

                {isCommentsLoading ? (
                  <div className="forum-card__status">Loading replies...</div>
                ) : id ? (
                  <CommentList
                    threadId={id}
                    comments={comments}
                    currentUserId={currentUser?.id ?? null}
                    currentUserRole={currentUser?.role ?? null}
                    onCommentCreated={handleCommentCreated}
                    onCommentUpdated={handleCommentUpdated}
                    onCommentDeleted={handleCommentDeleted}
                  />
                ) : (
                  <div className="forum-card__status">Missing thread id.</div>
                )}

                {id &&
                  (currentUser ? (
                    <CommentForm threadId={id} onCommentCreated={handleCommentCreated} />
                  ) : (
                    <p className="forum-card__status">Sign in to start a discussion!</p>
                  ))}
              </section>
            </div>

            <aside className="thread-layout__sidebar">
              {id && (
                <section>
                  <GroundedAiPanel
                    threadId={id}
                    hasSources={sources.some((source) => !source.isDeleted)}
                    canAskAi={thread.authorId === currentUser?.id}
                    isSignedIn={!!currentUser}
                    onJobQueued={() => {
                      window.setTimeout(() => {
                        void loadAiAnswers();
                      }, 6000);
                    }}
                  />
                </section>
              )}

              {currentUser && thread.authorId === currentUser.id && <AiJobStatusPanel />}

              <section className="forum-card ai-answer-summary-card">
                <div className="card-heading card-heading--split">
                  <div>
                    <h2>Previous AI answers</h2>
                    <p className="card-heading__text">
                      {aiAnswers.length === 0
                        ? 'No saved AI answers yet.'
                        : `${aiAnswers.length} saved AI answer${aiAnswers.length === 1 ? '' : 's'} in this thread.`}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="button--ghost"
                    onClick={() => {
                      void loadAiAnswers();
                      setIsAiAnswersModalOpen(true);
                    }}
                    disabled={isAiAnswersLoading}
                  >
                    Open history
                  </button>
                </div>

                {aiAnswersError && <p className="error-banner">{aiAnswersError}</p>}

                {!isAiAnswersLoading && aiAnswers.length > 0 && (
                  <p className="forum-card__status forum-card__status--compact">
                    Latest question: {aiAnswers[0].question.slice(0, 120)}
                    {aiAnswers[0].question.length > 120 ? '...' : ''}
                  </p>
                )}
              </section>

              {SHOW_RETRIEVAL_DEBUG_PANEL && id && (
                <RetrievalDebugPanel threadId={id} hasSources={activeSourceCount > 0} />
              )}
            </aside>
          </div>
        )}

        {isAiAnswersModalOpen && (
          <AiAnswerHistoryModal
            answers={aiAnswers}
            isLoading={isAiAnswersLoading}
            error={aiAnswersError}
            onClose={() => setIsAiAnswersModalOpen(false)}
          />
        )}
      </div>
    </main>
  );
}
