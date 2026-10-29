import React, { useState, useMemo, useEffect } from 'react';
import { useLinks, useDeleteLink, useRestoreLink } from '../services/linkService.js';
import { Copy, Check, ExternalLink, Archive, RotateCcw, ChevronLeft, ChevronRight, Search, Globe, Compass, Terminal } from 'lucide-react';

export const MetricsTable: React.FC = () => {
  const [page, setPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const isArchived = activeTab === 'archived';
  const { data, isLoading, isError, error, isFetching } = useLinks(page, 10, isArchived);
  const deleteMutation = useDeleteLink();
  const restoreMutation = useRestoreLink();

  useEffect(() => {
    if (!isFetching && data?.pagination && page > Math.max(1, data.pagination.totalPages)) {
      setPage(Math.max(1, data.pagination.totalPages));
    }
  }, [data?.pagination, isFetching, page]);

  const handleCopy = (id: number, shortCode: string) => {
    const fullUrl = `${window.location.origin}/${shortCode}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleArchive = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to archive link');
    }
  };

  const handleRestore = async (id: number) => {
    try {
      await restoreMutation.mutateAsync(id);
    } catch (err: any) {
      alert(err.message || 'Failed to restore link');
    }
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return 'link';
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / (60 * 1000));
      const diffHours = Math.floor(diffMs / (3600 * 1000));
      const diffDays = Math.floor(diffMs / (24 * 3600 * 1000));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;

      return past.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const filteredLinks = useMemo(() => {
    if (!data?.data) return [];
    if (!searchQuery.trim()) return data.data;
    return data.data.filter((link) => link.short_code === searchQuery);
  }, [data?.data, searchQuery]);

  return (
    <div>
      <div className="section-headline">
        <div className="section-accent-bar" style={{ background: '#f97316', boxShadow: '0 0 10px #f97316' }}></div>
        <h2 className="section-title">Active Directory</h2>
        <span className="section-sub">Edge routes & redirection archives</span>
      </div>

      <div className="table-card">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="nav-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('active');
                  setPage(1);
                }}
              >
                <span>Active</span>
                {data?.pagination && !isArchived && (
                  <span style={{ opacity: 0.7, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    ({data.pagination.total})
                  </span>
                )}
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'archived' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('archived');
                  setPage(1);
                }}
              >
                <span>Archived</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="search-box">
              <Search size={14} />
              <input
                type="text"
                className="search-input"
                placeholder="Search links..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Modern Cyber Data Table */}
        <div className="modern-table-wrap">
          {isLoading ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Querying edge route registry...
            </div>
          ) : isError ? (
            <div style={{ padding: '3.5rem 2rem', textAlign: 'center', color: '#f87171', fontFamily: 'var(--font-mono)' }}>
              Registry query error: {(error as any)?.message || 'Network error'}
            </div>
          ) : filteredLinks.length === 0 ? (
            <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem auto', color: 'var(--text-muted)' }}>
                <Globe size={22} />
              </div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, fontFamily: 'var(--font-cyber)', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                NO ROUTES RECORDED
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {searchQuery
                  ? 'No shortened links match your search query.'
                  : isArchived
                  ? 'No archived links in your workspace.'
                  : 'No active links available for this page view.'}
              </p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th style={{ width: '280px' }}>Short Link</th>
                  <th>Destination</th>
                  <th style={{ textAlign: 'center', width: '90px' }}>Clicks</th>
                  <th style={{ width: '130px' }}>Top Referrer</th>
                  <th style={{ textAlign: 'center', width: '100px' }}>Conversion</th>
                  <th style={{ width: '100px' }}>Created</th>
                  <th style={{ textAlign: 'right', width: '110px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinks.map((link) => {
                  const shortUrl = `${window.location.origin}/${link.short_code}`;
                  const isCopied = copiedId === link.id;
                  const domain = getDomain(link.original_url);

                  return (
                    <tr key={link.id}>
                      <td>
                        <div className="link-identity">
                          <img
                            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
                            alt=""
                            className="favicon-icon"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <a
                              href={shortUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="slug-text"
                            >
                              /{link.short_code}
                            </a>
                            <button
                              type="button"
                              className="btn-ghost"
                              style={{ padding: '0.2rem 0.35rem' }}
                              title="Copy link"
                              onClick={() => handleCopy(link.id, link.short_code)}
                            >
                              {isCopied ? <Check size={12} color="var(--neon-green)" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="target-url-text" title={link.original_url}>
                          {link.original_url}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className="badge-pill badge-clicks">
                          {link.clicks.toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <div className="badge-referrer">
                          <Compass size={11} />
                          <span>{link.top_referrer || 'direct'}</span>
                        </div>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <span className="badge-pill badge-rate">
                          {link.conversion_rate}%
                        </span>
                      </td>

                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                        {formatRelativeTime(link.created_at)}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                          <a
                            href={shortUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-ghost"
                            style={{ padding: '0.35rem' }}
                            title="Open URL"
                          >
                            <ExternalLink size={13} />
                          </a>

                          {isArchived ? (
                            <button
                              type="button"
                              className="btn-secondary"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.75rem', color: '#86efac' }}
                              onClick={() => handleRestore(link.id)}
                              disabled={restoreMutation.isPending}
                            >
                              <RotateCcw size={12} />
                              <span>Restore</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-danger-ghost"
                              title="Archive link"
                              onClick={() => handleArchive(link.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Archive size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="pagination-container">
            <div className="pagination-info">
              Page {data.pagination.page} of {data.pagination.totalPages} · ({data.pagination.total} total links)
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem' }}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft size={14} />
                <span>Previous</span>
              </button>

              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '0.4rem 0.75rem' }}
                disabled={page >= data.pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
