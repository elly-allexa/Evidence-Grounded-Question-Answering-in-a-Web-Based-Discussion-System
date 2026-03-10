import { HomePage } from './routes/HomePage';
import { ThreadsPage } from './routes/ThreadsPage';
import { ThreadDetailsPage } from './routes/ThreadDetailsPage';
import { BrowserRouter, Route, Routes, Link } from 'react-router-dom';

function App() {
  return (
  <BrowserRouter>
    <nav style={{ padding: '1rem', borderBottom: '1px solid #ccc' }}>
      <Link to="/" style={{ marginRight: '1rem' }}>
        Home
      </Link>
      <Link to="/threads">Threads</Link>
    </nav>

    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/threads" element={<ThreadsPage />} />
      <Route path="/threads/:id" element={<ThreadDetailsPage />} />
    </Routes>
    </BrowserRouter>
  );
}
export default App;
