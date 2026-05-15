import { HealthStatus } from '../features/health/components/HealthStatus';

export function HomePage() {
  return (
    <main className="forum-page">
      <div className="forum-page__inner home-page">
        <section className="forum-card thread-hero home-page__hero">
          <p className="forum-page__eyebrow">Evidence-grounded forum</p>
          <h1>MakeSense AI Forum</h1>
          <p className="thread-hero__content">
            A polished demo forum for evidence-based AI answers, thread discussion, and
            source-backed citations.
          </p>
        </section>

        <section className="forum-card home-page__panel">
          <h2>Frontend foundation is ready</h2>
          <p className="card-heading__text">
            Use the threads view to review discussions, attached evidence, and grounded AI answers.
          </p>

          <div className="home-page__status">
            <HealthStatus />
          </div>
        </section>
      </div>
    </main>
  );
}
