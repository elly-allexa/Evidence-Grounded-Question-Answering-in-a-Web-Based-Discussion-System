import { useEffect, useState } from 'react';
import { fetchDbHealth, fetchHealth } from '../api/healthApi';
import type { DbHealthResponse, HealthResponse } from '../types/health.types';

export function HealthStatus() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [dbHealth, setDbHealth] = useState<DbHealthResponse | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    async function loadHealth() {
      try {
        const [healthData, dbHealthData] = await Promise.all([fetchHealth(), fetchDbHealth()]);

        setHealth(healthData);
        setDbHealth(dbHealthData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Unknown error');
        }
      }
    }

    loadHealth();
  }, []);

  return (
    <section>
      <h2>Backend connection check</h2>

      {error && (
        <div style={{ color: 'red', marginBottom: '1rem' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <h3>/health</h3>
        <pre>{health ? JSON.stringify(health, null, 2) : 'Loading...'}</pre>
      </div>

      <div>
        <h3>/health/db</h3>
        <pre>{dbHealth ? JSON.stringify(dbHealth, null, 2) : 'Loading...'}</pre>
      </div>
    </section>
  );
}
