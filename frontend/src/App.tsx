import React from 'react';
import { Header } from './components/Header';
import { ShortenCard } from './components/ShortenCard';
import { StatsCards } from './components/StatsCards';
import { MetricsTable } from './components/MetricsTable';

export const App: React.FC = () => {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <ShortenCard />
        <StatsCards />
        <MetricsTable />
      </main>
      <footer style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(7, 8, 12, 0.95)', padding: '2rem 1.5rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <span>LinkSnip Analytics Engine · Built for high throughput edge redirects</span>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>SQLite 3.45</span>
            <span style={{ color: 'var(--text-muted)' }}>Node.js 22</span>
            <span style={{ color: 'var(--text-muted)' }}>React 18</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
