import { useEffect, useState, type FormEvent } from 'react';
import { fetchMe, updateMe, uploadAvatar } from '../features/auth/api/authApi';
import type { UserProfile } from '../features/auth/api/authApi';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  async function loadProfile() {
    try {
      setError('');
      setIsLoading(true);

      const data = await fetchMe();

      setProfile(data);
      setUsername(data.username);
      setBio(data.bio ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError('');
      setStatus('');
      setIsSaving(true);

      const updated = await updateMe({
        username: username.trim(),
        bio: bio.trim(),
      });

      setProfile(updated);
      setStatus('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      setError('');
      setStatus('');
      setIsUploadingAvatar(true);

      const updated = await uploadAvatar(file);

      setProfile(updated);
      setStatus('Avatar updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  function handleSignOut() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }

  if (isLoading) {
    return (
      <main className="forum-page">
        <div className="forum-page__inner">
          <section className="forum-card">
            <p className="forum-card__status">Loading profile...</p>
          </section>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="forum-page">
        <div className="forum-page__inner">
          <section className="forum-card">
            <h1>Profile</h1>

            {error && <p className="error-banner">{error}</p>}

            <p className="forum-card__status">
              You are not signed in. Use the Sign in button in the navigation bar.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="forum-page">
      <div className="forum-page__inner">
        <header className="forum-page__header">
          <p className="forum-page__eyebrow">User profile</p>
          <h1>Profile</h1>
        </header>

        <section className="forum-card profile-card">
          {error && <p className="error-banner">{error}</p>}
          {status && <p className="success-banner">{status}</p>}

          <div className="profile-card__header">
            <div className="profile-card__avatar">
              {profile.avatarUrl ? (
                <img
                  src={
                    profile.avatarUrl.startsWith('http')
                      ? profile.avatarUrl
                      : `${import.meta.env.VITE_API_URL}${profile.avatarUrl}`
                  }
                  alt={`${profile.username} avatar`}
                />
              ) : (
                <span>{profile.username.slice(0, 1).toUpperCase()}</span>
              )}
            </div>

            <div>
              <h2>@{profile.username}</h2>
              <p className="forum-card__status">{profile.email}</p>

              <label
                className="app-nav__link"
                style={{ display: 'inline-block', marginTop: '0.75rem' }}
              >
                {isUploadingAvatar ? 'Uploading...' : 'Change avatar'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  disabled={isUploadingAvatar}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <form className="thread-form" onSubmit={handleSubmit}>
            <div className="thread-form__field">
              <label htmlFor="profile-username">Username</label>
              <input
                id="profile-username"
                className="thread-form__input"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                maxLength={40}
                disabled={isSaving}
              />
            </div>

            <div className="thread-form__field">
              <label htmlFor="profile-bio">Bio</label>
              <textarea
                id="profile-bio"
                className="thread-form__textarea"
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                maxLength={500}
                rows={5}
                disabled={isSaving}
                placeholder="Write a short bio..."
              />
              <div className="field-meta">{bio.length}/500</div>
            </div>

            <div className="action-row">
              <button type="submit" disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save profile'}
              </button>

              <button type="button" className="button--ghost" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
