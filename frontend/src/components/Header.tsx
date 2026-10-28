import React from 'react';
import { Zap, Github, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div className="brand-wrap">
            <div className="brand-icon">
              <Zap size={18} fill="#fff" strokeWidth={0} />
            </div>
            <div>
              <div className="brand-name">LinkSnip</div>
            </div>
          </div>

          <nav className="nav-links">
            <a href="#about" className="nav-link-item">About</a>
            <a href="#analytics" className="nav-link-item">Analytics</a>
            <a href="#docs" className="nav-link-item">Docs</a>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
            style={{ padding: '0.45rem 0.65rem' }}
            title="GitHub Repository"
          >
            <Github size={16} />
          </a>
        </div>
      </div>
    </header>
  );
};
