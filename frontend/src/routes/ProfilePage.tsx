import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { deleteAvatar, fetchMe, updateMe, uploadAvatar } from '../features/auth/api/authApi';
import type { UserProfile } from '../features/auth/api/authApi';

export function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [shouldRemoveAvatar, setShouldRemoveAvatar] = useState(false);
  const [hasAvatarImageError, setHasAvatarImageError] = useState(false);

  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const avatarPreviewUrl = useMemo(() => {
    if (!selectedAvatarFile) {
      return null;
    }

    return URL.createObjectURL(selectedAvatarFile);
  }, [selectedAvatarFile]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrl) {
        URL.revokeObjectURL(avatarPreviewUrl);
      }
    };
  }, [avatarPreviewUrl]);

  useEffect(() => {
    if (!error && !status) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setError('');
      setStatus('');
    }, 30000);

    return () => window.clearTimeout(timeoutId);
  }, [error, status]);

  async function loadProfile() {
    try {
      setError('');
      setIsLoading(true);

      const data = await fetchMe();

      setProfile(data);
      setUsername(data.username);
      setBio(data.bio ?? '');
      setSelectedAvatarFile(null);
      setShouldRemoveAvatar(false);
      setHasAvatarImageError(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      setError('');
      setStatus('');
      setIsSaving(true);

      let updated = await updateMe({
        username: username.trim(),
        bio: bio.trim(),
      });

      if (shouldRemoveAvatar) {
        updated = await deleteAvatar();
      } else if (selectedAvatarFile) {
        updated = await uploadAvatar(selectedAvatarFile);
      }

      setProfile(updated);
      setUsername(updated.username);
      setBio(updated.bio ?? '');
      setSelectedAvatarFile(null);
      setShouldRemoveAvatar(false);
      setHasAvatarImageError(false);
      setStatus('Profile updated successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  }

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError('');
    setStatus('Avatar selected. Click Save profile to apply changes.');
    setSelectedAvatarFile(file);
    setShouldRemoveAvatar(false);
    setHasAvatarImageError(false);
  }

  function handleDeleteAvatar() {
    setError('');
    setStatus('Avatar will be removed after you click Save profile.');
    setSelectedAvatarFile(null);
    setShouldRemoveAvatar(true);
    setHasAvatarImageError(false);
  }

  function handleSignOut() {
    localStorage.removeItem('access_token');
    window.location.href = '/';
  }

  function getAvatarSrc() {
    if (shouldRemoveAvatar) {
      return null;
    }

    if (avatarPreviewUrl) {
      return avatarPreviewUrl;
    }

    if (!profile?.avatarUrl || hasAvatarImageError) {
      return null;
    }

    return profile.avatarUrl.startsWith('http')
      ? profile.avatarUrl
      : `${import.meta.env.VITE_API_URL}${profile.avatarUrl}`;
  }

  const avatarSrc = getAvatarSrc();

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

            <p className="forum-card__status">Sign in to view and edit your profile.</p>
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
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${profile.username} avatar`}
                  onError={() => setHasAvatarImageError(true)}
                />
              ) : (
                <span aria-label="Default user avatar">👤</span>
              )}
            </div>

            <div>
              <h2>@{profile.username}</h2>
              <p className="forum-card__status">{profile.email}</p>

              <div className="profile-card__avatar-actions">
                <label className="profile-card__avatar-button">
                  Change avatar
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleAvatarChange}
                    disabled={isSaving}
                    style={{ display: 'none' }}
                  />
                </label>

                {(profile.avatarUrl || selectedAvatarFile) && !shouldRemoveAvatar && (
                  <button
                    type="button"
                    className="profile-card__avatar-button profile-card__avatar-button--danger"
                    onClick={handleDeleteAvatar}
                    disabled={isSaving}
                  >
                    Delete avatar
                  </button>
                )}
              </div>
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
                maxLength={15}
                disabled={isSaving}
              />
              <div className="field-meta">{username.length}/15</div>
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

              <button type="button" className="button--ghost--signout" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
