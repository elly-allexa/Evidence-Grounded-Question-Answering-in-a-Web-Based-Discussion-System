import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchPublicUserProfile, type PublicUserProfile } from '../features/users/api/usersApi';
import { UserAvatar } from '../features/users/components/UserAvatar';

export function PublicUserProfilePage() {
  const { username } = useParams<{ username: string }>();

  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      if (!username) {
        setError('Missing username.');
        setIsLoading(false);
        return;
      }

      try {
        setError('');
        setIsLoading(true);

        const data = await fetchPublicUserProfile(username);

        if (!cancelled) {
          setProfile(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setProfile(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, [username]);

  return (
    <main className="forum-page">
      <div className="forum-page__inner">
        <div className="forum-page__backlink">
          <Link to="/threads#thread-list">&lt;- Back to threads</Link>
        </div>

        <header className="forum-page__header">
          <p className="forum-page__eyebrow">Public profile</p>
          <h1>User profile</h1>
        </header>

        {error && <p className="error-banner">{error}</p>}

        {isLoading ? (
          <section className="forum-card">
            <p className="forum-card__status">Loading user profile...</p>
          </section>
        ) : !profile ? (
          <section className="forum-card">
            <p className="forum-card__status">User profile not found.</p>
          </section>
        ) : (
          <section className="forum-card public-profile-card">
            <div className="profile-card__header">
              <UserAvatar username={profile.username} avatarUrl={profile.avatarUrl} size="lg" />

              <div>
                <h2>@{profile.username}</h2>
                <p className="forum-card__status">
                  Role: {profile.role === 'ADMIN' ? 'Admin' : 'User'}
                </p>
                <p className="forum-card__status">
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="forum-card__subsection">
              <h3>Bio</h3>
              <p className="thread-hero__content">
                {profile.bio?.trim() || 'This user has not added a bio yet.'}
              </p>
            </div>

            <div className="admin-user-card__stats">
              <span>Threads: {profile._count.threads}</span>
              <span>Comments: {profile._count.comments}</span>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
