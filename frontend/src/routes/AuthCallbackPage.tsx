import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');

    if (token) {
      localStorage.setItem('access_token', token);
      navigate('/profile', { replace: true });
      return;
    }

    navigate('/', { replace: true });
  }, [searchParams, navigate]);

  return (
    <main className="forum-page">
      <div className="forum-page__inner">
        <section className="forum-card">
          <h1>Signing you in...</h1>
          <p className="forum-card__status">Please wait.</p>
        </section>
      </div>
    </main>
  );
}
