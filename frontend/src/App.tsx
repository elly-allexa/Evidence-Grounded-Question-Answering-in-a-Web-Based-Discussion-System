import { HomePage } from './routes/HomePage';
import { ThreadsPage } from './routes/ThreadsPage';
import { ThreadDetailsPage } from './routes/ThreadDetailsPage';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <nav className="app-nav">
          <div>
            <Link className="app-nav__brand" to="/">
              <span className="app-logo-frame">
                <img src="/logo.png" alt="MakeSense AI Forum logo" className="app-logo" />
              </span>
              <span>MakeSense AI Forum</span>
            </Link>
            <p className="app-nav__subtitle">FER thesis demo</p>
          </div>

          <div className="app-nav__links">
            <Link className="app-nav__link" to="/">
              Home
            </Link>
            <Link className="app-nav__link" to="/threads">
              Threads
            </Link>
          </div>
        </nav>

        <div className="app-shell__content">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/threads" element={<ThreadsPage />} />
            <Route path="/threads/:id" element={<ThreadDetailsPage />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
export default App;
