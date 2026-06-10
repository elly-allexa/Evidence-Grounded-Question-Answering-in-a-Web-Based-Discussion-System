import { useEffect, useState, type FormEvent } from 'react';
import { fetchAdminUsers, updateUserRole, type AdminUser } from '../features/admin/api/adminApi';

export function AdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [pendingUserId, setPendingUserId] = useState('');

  async function loadUsers() {
    try {
      setError('');
      setIsLoading(true);

      const data = await fetchAdminUsers(search);

      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setUsers([]);
      setTotal(0);

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
    void loadUsers();
  }, [search]);

  useEffect(() => {
    if (!error && !status) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError('');
      setStatus('');
    }, 20000);

    return () => window.clearTimeout(timeoutId);
  }, [error, status]);

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearch(searchInput.trim());
  }

  async function handleToggleRole(user: AdminUser) {
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';

    try {
      setError('');
      setStatus('');
      setPendingUserId(user.id);

      const updatedUser = await updateUserRole(user.id, nextRole);

      setUsers((prev) => prev.map((item) => (item.id === user.id ? updatedUser : item)));
      setStatus(`${updatedUser.username} is now ${updatedUser.role}.`);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unknown error');
      }
    } finally {
      setPendingUserId('');
    }
  }

  return (
    <main className="forum-page admin-page">
      <div className="forum-page__inner">
        <header className="forum-page__header">
          <div>
            <p className="forum-page__eyebrow">Administration</p>
            <h1>Admin console</h1>
            <p className="card-heading__text">Manage users and change roles for moderation.</p>
          </div>
        </header>

        {error && <p className="error-banner">{error}</p>}
        {status && <p className="success-banner">{status}</p>}

        <section className="forum-card admin-page__panel">
          <div className="card-heading">
            <div>
              <h2>Users</h2>
              <p className="card-heading__text">Total users matched: {total}</p>
            </div>
          </div>

          <form className="thread-toolbar admin-page__search" onSubmit={handleSearchSubmit}>
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by username or email..."
              className="thread-toolbar__search"
            />

            <button type="submit">Search</button>

            {search && (
              <button
                type="button"
                className="button--ghost"
                onClick={() => {
                  setSearchInput('');
                  setSearch('');
                }}
              >
                Clear
              </button>
            )}
          </form>

          {isLoading ? (
            <p className="forum-card__status">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="forum-card__status">No users found.</p>
          ) : (
            <div className="admin-user-list">
              {users.map((user) => (
                <article key={user.id} className="admin-user-card">
                  <div className="admin-user-card__header">
                    <div>
                      <h3>@{user.username}</h3>
                      <p>{user.email}</p>
                    </div>

                    <div className="admin-user-card__badges">
                      <span className="admin-badge admin-badge--role">{user.role}</span>
                      {user.isRootAdmin && <span className="admin-badge">Root admin</span>}
                    </div>
                  </div>

                  <div className="admin-user-card__stats">
                    <span>Threads: {user._count.threads}</span>
                    <span>Comments: {user._count.comments}</span>
                    <span>AI jobs: {user._count.aiJobs}</span>
                  </div>

                  <div className="admin-user-card__actions">
                    <button
                      type="button"
                      onClick={() => handleToggleRole(user)}
                      disabled={pendingUserId === user.id || user.isRootAdmin}
                    >
                      {pendingUserId === user.id
                        ? 'Updating...'
                        : user.role === 'ADMIN'
                          ? 'Demote to user'
                          : 'Promote to admin'}
                    </button>

                    {user.isRootAdmin && <span className="admin-user-card__note">Protected account</span>}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}