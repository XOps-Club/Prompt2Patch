import React from 'react';
import { useGlobalStats } from '../services/linkService.js';
import { Link2, MousePointer, Users, ArrowUpRight, Percent, Activity } from 'lucide-react';

export const StatsCards: React.FC = () => {
  const { data: stats, isLoading, isError } = useGlobalStats();

  return (
    <div>
      <div className="section-headline">
        <div className="section-accent-bar"></div>
        <h2 className="section-title">System Telemetry</h2>
        <span className="section-sub">Real-time edge routing metrics</span>
      </div>

      <div className="metrics-grid">
        <div className="metric-tile">
          <div className="metric-head">
            <span className="metric-label">Active Links</span>
            <div className="metric-icon-wrap">
              <Link2 size={14} />
            </div>
          </div>
          <div className="metric-number">
            {isLoading ? '...' : isError || stats?.totalLinks === undefined ? '—' : stats.totalLinks}
          </div>
          <div className="metric-trend">
            <ArrowUpRight size={12} color="var(--neon-green)" />
            <span style={{ color: 'var(--neon-green)' }}>+8.4%</span>
            <span>routing cluster</span>
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-head">
            <span className="metric-label">Total Clicks</span>
            <div className="metric-icon-wrap">
              <MousePointer size={14} />
            </div>
          </div>
          <div className="metric-number">
            {isLoading ? '...' : isError ? '—' : (stats?.totalClicks ?? 0).toLocaleString()}
          </div>
          <div className="metric-trend">
            <ArrowUpRight size={12} color="var(--neon-orange)" />
            <span style={{ color: 'var(--neon-orange)' }}>+14.1%</span>
            <span>traffic load</span>
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-head">
            <span className="metric-label">Unique Visitors</span>
            <div className="metric-icon-wrap">
              <Users size={14} />
            </div>
          </div>
          <div className="metric-number">
            {isLoading ? '...' : isError ? '—' : (stats?.totalUniqueClicks ?? 0).toLocaleString()}
          </div>
          <div className="metric-trend">
            <ArrowUpRight size={12} color="var(--neon-cyan)" />
            <span style={{ color: 'var(--neon-cyan)' }}>+9.2%</span>
            <span>unique nodes</span>
          </div>
        </div>

        <div className="metric-tile">
          <div className="metric-head">
            <span className="metric-label">Avg Conversion</span>
            <div className="metric-icon-wrap">
              <Percent size={14} />
            </div>
          </div>
          <div className="metric-number">
            {isLoading ? '...' : isError ? '—' : `${stats?.averageConversionRate ?? 0}%`}
          </div>
          <div className="metric-trend">
            <Activity size={12} color="#a855f7" />
            <span style={{ color: '#c084fc' }}>Global throughput</span>
          </div>
        </div>
      </div>
    </div>
  );
};
