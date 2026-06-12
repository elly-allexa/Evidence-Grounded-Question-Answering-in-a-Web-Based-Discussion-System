import { useState, useEffect } from 'react';
import { HomePage } from './routes/HomePage';
import { ThreadsPage } from './routes/ThreadsPage';
import { ThreadDetailsPage } from './routes/ThreadDetailsPage';
import { ProfilePage } from './routes/ProfilePage';
import { AuthCallbackPage } from './routes/AuthCallbackPage';
import { PublicUserProfilePage } from './routes/PublicUserProfilePage';
import { NotificationBell } from './features/notifications/components/NotificationBell';
import { BrowserRouter, Route, Routes, Link, useNavigate, useLocation } from 'react-router-dom';
import { AdminPage } from './routes/AdminPage';
import { fetchMe } from './features/auth/api/authApi';
import type { UserProfile } from './features/auth/api/authApi';

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [navSearch, setNavSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
  }

  function handleNavSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedSearch = navSearch.trim();

    if (!normalizedSearch) {
      navigate('/threads#thread-list');
      closeMobileMenu();
      return;
    }

    navigate(`/threads?search=${encodeURIComponent(normalizedSearch)}#thread-list`);
    closeMobileMenu();
  }

  useEffect(() => {
    let mounted = true;

    fetchMe()
      .then((user) => {
        if (mounted) setCurrentUser(user);
      })
      .catch(() => {
        if (mounted) setCurrentUser(null);
      });

    return () => {
      mounted = false;
    };
  }, [location.pathname, location.search]);

  return (
    <div className="app-shell">
      <nav className={`app-nav ${isMobileMenuOpen ? 'app-nav--open' : ''}`}>
        <div className="app-nav__top">
          <Link className="app-nav__brand" to="/" onClick={closeMobileMenu}>
            <span className="app-logo-frame">
              <img src="/logo.png" alt="MakeSense AI Forum logo" className="app-logo" />
            </span>
            <span>MakeSense AI Forum</span>
          </Link>

          <button
            type="button"
            className="app-nav__menu-button"
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>
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
          <Link className="app-nav__link" to="/" onClick={closeMobileMenu}>
            Home
          </Link>

          <Link className="app-nav__link" to="/threads" onClick={closeMobileMenu}>
            Threads
          </Link>

          {currentUser && (
            <Link className="app-nav__link" to="/threads?mine=true" onClick={closeMobileMenu}>
              My Threads
            </Link>
          )}

          <Link className="app-nav__link" to="/profile" onClick={closeMobileMenu}>
            Profile
          </Link>

          {currentUser?.role === 'ADMIN' && (
            <Link className="app-nav__link" to="/admin" onClick={closeMobileMenu}>
              Admin
            </Link>
          )}

          {!currentUser && (
            <a
              className="app-nav__link"
              href={`${import.meta.env.VITE_API_URL}/auth/google`}
              onClick={closeMobileMenu}
            >
              Sign in
            </a>
          )}

          {currentUser && <NotificationBell />}
        </div>
      </nav>

      <div className="app-shell__content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/threads" element={<ThreadsPage />} />
          <Route path="/threads/:id" element={<ThreadDetailsPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/users/:username" element={<PublicUserProfilePage />} />
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
