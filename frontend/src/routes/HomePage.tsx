import { HealthStatus } from '../features/health/components/HealthStatus';

export function HomePage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <h1>MakeSense AI Forum</h1>
      <p>Frontend foundation is ready!</p>

      <HealthStatus />
    </main>
  );
}
