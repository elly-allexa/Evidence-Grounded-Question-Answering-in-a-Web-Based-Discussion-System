import { useEffect, useState } from 'react';
import { HomePage } from './routes/HomePage';
import { ThreadsPage } from './routes/ThreadsPage';
import { ThreadDetailsPage } from './routes/ThreadDetailsPage';
import { ProfilePage } from './routes/ProfilePage';
import { AuthCallbackPage } from './routes/AuthCallbackPage';
import { NotificationBell } from './features/notifications/components/NotificationBell';
import { BrowserRouter, Route, Routes, Link, useLocation, useNavigate } from 'react-router-dom';
import { fetchMe, type UserProfile } from './features/auth/api/authApi';
import { AdminPage } from './routes/AdminPage';

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navSearch, setNavSearch] = useState('');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

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
  }, [location.pathname, location.search]);

  function handleNavSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedSearch = navSearch.trim();

    if (!normalizedSearch) {
      navigate('/threads#thread-list');
      return;
    }

    navigate(`/threads?search=${encodeURIComponent(normalizedSearch)}#thread-list`);
  }

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div>
          <Link className="app-nav__brand" to="/">
            <span className="app-logo-frame">
              <img src="/logo.png" alt="MakeSense AI Forum logo" className="app-logo" />
            </span>
            <span>MakeSense AI Forum</span>
          </Link>
        </div>

        <form className="app-nav__search" onSubmit={handleNavSearchSubmit}>
          <input
            type="search"
            value={navSearch}
            onChange={(event) => setNavSearch(event.target.value)}
            placeholder="Search threads..."
            aria-label="Search threads"
          />
        </form>

        <div className="app-nav__links">
          <Link className="app-nav__link" to="/">
            Home
          </Link>

          <Link className="app-nav__link" to="/threads">
            Threads
          </Link>

          <Link className="app-nav__link" to="/threads?mine=true">
            My Threads
          </Link>

          <NotificationBell />

          <Link className="app-nav__link" to="/profile">
            Profile
          </Link>

          {currentUser?.role === 'ADMIN' && (
            <Link className="app-nav__link" to="/admin">
              Admin
            </Link>
          )}

          <a className="app-nav__link" href={`${import.meta.env.VITE_API_URL}/auth/google`}>
            Sign in
          </a>
        </div>
      </nav>

      <div className="app-shell__content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/threads" element={<ThreadsPage />} />
          <Route path="/threads/:id" element={<ThreadDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;
