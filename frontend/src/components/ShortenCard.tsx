import React, { useState } from 'react';
import { useCreateLink, getQrCodeUrl } from '../services/linkService.js';
import { ShortenInputSchema } from '../schemas/link.schema.js';
import type { LinkItem } from '../schemas/link.schema.js';
import { Link2, Copy, Check, ExternalLink, SlidersHorizontal, QrCode, X, Zap, AlertTriangle } from 'lucide-react';

export const ShortenCard: React.FC = () => {
  const [url, setUrl] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<LinkItem | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  const createMutation = useCreateLink();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const result = ShortenInputSchema.safeParse({
      originalUrl: url.trim(),
      customSlug: customSlug.trim() || undefined
    });

    if (!result.success) {
      setValidationError(result.error.issues[0].message);
      return;
    }

    try {
      const newLink = await createMutation.mutateAsync(result.data);
      setCreatedLink(newLink);
      setUrl('');
      setCustomSlug('');
      setShowOptions(false);
    } catch (err: any) {
      setValidationError(err.message || 'Failed to shorten URL');
    }
  };

  const fullShortUrl = createdLink ? `${window.location.origin}/${createdLink.short_code}` : '';

  const handleCopy = () => {
    if (!fullShortUrl) return;
    navigator.clipboard.writeText(fullShortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <div className="hero-headline">
        <div className="hero-pill-badge">
          <Zap size={13} fill="currentColor" strokeWidth={0} />
          <span>High-Performance Redirect Engine — Edge Edition</span>
        </div>

        <h1 className="hero-title">
          <div className="hero-title-row">
            <span className="glow-chaos">Shorten Links</span>
            <span className="hero-or">with</span>
          </div>
          <div className="hero-title-row">
            <span className="glow-release">Real-Time Analytics</span>
          </div>
        </h1>

        <p className="hero-subtitle">
          High-performance redirection and edge metrics in a single lightweight dashboard.
        </p>
      </div>

      {/* Terminal Window Container */}
      <div className="terminal-window">
        <div className="terminal-titlebar">
          <div className="terminal-dots">
            <span className="dot dot-red"></span>
            <span className="dot dot-yellow"></span>
            <span className="dot dot-green"></span>
          </div>
          <div className="terminal-prompt-title">
            $ linksnip shorten --target
          </div>
          <div className="terminal-badge">
            bash · v2.4.0
          </div>
        </div>

        <div className="terminal-body">
          <form onSubmit={handleSubmit}>
            <label className="cyber-label">TARGET_URL</label>
            <div className="input-group">
              <div className="input-icon-wrap">
                <Link2 size={18} />
              </div>

              <input
                type="text"
                className="clean-input"
                placeholder="https://github.com/trending..."
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (validationError) setValidationError(null);
                }}
                disabled={createMutation.isPending}
              />

              <button
                type="button"
                className={`btn-ghost ${showOptions ? 'active' : ''}`}
                title="Configure custom slug"
                onClick={() => setShowOptions(!showOptions)}
              >
                <SlidersHorizontal size={14} />
                <span style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>SLUG</span>
              </button>

              <button
                type="submit"
                className="btn-primary"
                disabled={createMutation.isPending || !url.trim()}
              >
                {createMutation.isPending ? 'PROCESSING...' : '► SHORTEN LINK'}
              </button>
            </div>

            {showOptions && (
              <div className="slug-options-drawer">
                <label className="cyber-label" style={{ width: '100%', marginBottom: '0.25rem' }}>
                  CUSTOM_ALIAS
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="slug-prefix-badge">{window.location.host}/</span>
                  <input
                    type="text"
                    className="slug-input"
                    placeholder="custom-slug"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-faint)', fontFamily: 'var(--font-mono)' }}>
                  [a-z0-9-_]
                </span>
              </div>
            )}

            {validationError && (
              <div className="cyber-error-box">
                <AlertTriangle size={15} />
                <span>{validationError}</span>
              </div>
            )}
          </form>

          {/* Generated Link Result Bar */}
          {createdLink && (
            <div className="result-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', minWidth: '260px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--neon-green)', boxShadow: '0 0 8px var(--neon-green)' }}></div>
                <div>
                  <a
                    href={fullShortUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="result-link-text"
                  >
                    {fullShortUrl}
                  </a>
                  <div className="result-target-preview">
                    Target: {createdLink.original_url}
                  </div>
                </div>
              </div>

              {/* QR Code Preview for newly created link */}
              <div className="result-qr-box" style={{ background: '#fff', padding: '0.25rem', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                  src={getQrCodeUrl(fullShortUrl)}
                  alt="QR Code"
                  width={52}
                  height={52}
                  style={{ display: 'block' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCopy}
                  style={{ padding: '0.5rem 0.9rem' }}
                >
                  {copied ? (
                    <>
                      <Check size={14} color="var(--neon-green)" />
                      <span style={{ color: 'var(--neon-green)' }}>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowQrModal(true)}
                  style={{ padding: '0.5rem 0.7rem' }}
                  title="View QR Code"
                >
                  <QrCode size={14} />
                </button>

                <a
                  href={fullShortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary"
                  style={{ padding: '0.5rem 0.7rem' }}
                  title="Open Link"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          <div className="terminal-footer-links">
            <span>⚙ Edge Engine</span>
            <span>·</span>
            <span>📊 Real-Time Analytics</span>
            <span>·</span>
            <span>🌐 Global CDN</span>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQrModal && createdLink && (
        <div className="modal-backdrop" onClick={() => setShowQrModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="var(--neon-green)" />
                <span style={{ fontWeight: 700, fontSize: '1rem', fontFamily: 'var(--font-cyber)' }}>LINK QR CODE</span>
              </div>
              <button
                type="button"
                className="btn-ghost"
                style={{ padding: '0.25rem' }}
                onClick={() => setShowQrModal(false)}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#fff', padding: '1.25rem', borderRadius: '12px', display: 'inline-block', marginBottom: '1rem' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(fullShortUrl)}`}
                alt="QR Code"
                width={180}
                height={180}
                style={{ display: 'block' }}
              />
            </div>

            <div className="font-mono" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              /{createdLink.short_code}
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setShowQrModal(false)}
            >
              DONE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
