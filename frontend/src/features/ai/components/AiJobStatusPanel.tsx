import { useEffect, useState } from 'react';
import { fetchMyAiJobs } from '../api/aiApi';
import type { AiJob } from '../types/aiJob.types';

export function AiJobStatusPanel() {
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  async function loadJobs() {
    const data = await fetchMyAiJobs();
    setJobs(data);
  }

  useEffect(() => {
    void loadJobs();

    const intervalId = window.setInterval(() => {
      void loadJobs();
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (jobs.length === 0) {
    return null;
  }

  const visibleJobs = isExpanded ? jobs : jobs.slice(0, 5);

  return (
    <section className="forum-card ai-answer-summary-card">
      <div className="card-heading card-heading--split">
        <h2>AI job status</h2>

        {jobs.length > 5 && (
          <button
            type="button"
            className="button--ghost"
            onClick={() => setIsExpanded((prev) => !prev)}
          >
            {isExpanded ? 'Show less' : `Show more (${jobs.length - 5})`}
          </button>
        )}
      </div>

      <div className="notification-list">
        {visibleJobs.map((job) => (
          <article key={job.id} className="notification-item">
            <strong>{job.status}</strong>
            <p>
              {job.question.slice(0, 120)}
              {job.question.length > 120 ? '...' : ''}
            </p>
            {job.status === 'FAILED' && job.error && <p className="error-banner">{job.error}</p>}
            <small>{new Date(job.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
