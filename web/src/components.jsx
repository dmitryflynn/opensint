import React, { useState, useCallback } from 'react';

// ── Reusable async runner: handles loading / error / data for a lookup ──
export function useLookup(fn) {
  const [state, setState] = useState({ status: 'idle', data: null, error: null });
  const run = useCallback(
    async (...args) => {
      setState({ status: 'loading', data: null, error: null });
      try {
        const data = await fn(...args);
        setState({ status: 'done', data, error: null });
        return data;
      } catch (err) {
        setState({ status: 'error', data: null, error: err.message });
      }
    },
    [fn]
  );
  return { ...state, run, reset: () => setState({ status: 'idle', data: null, error: null }) };
}

export function Spinner({ label }) {
  return (
    <div className="row" style={{ gap: 10, color: 'var(--muted)' }}>
      <span className="spinner" /> {label || 'Working…'}
    </div>
  );
}

export function ErrorBox({ children }) {
  return <div className="error-box">⚠ {children}</div>;
}

export function NoteBox({ children }) {
  return <div className="note-box">{children}</div>;
}

export function EmptyState({ icon = '🛰', title, children }) {
  return (
    <div className="center-state">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text)' }}>{title}</div>
      {children && <div style={{ maxWidth: 420 }}>{children}</div>}
    </div>
  );
}

export function Card({ title, source, right, children }) {
  return (
    <div className="card">
      {(title || right) && (
        <div className="card-head">
          <h3>{title}</h3>
          <div className="row" style={{ gap: 12 }}>
            {source && <span className="src">{source}</span>}
            {right}
          </div>
        </div>
      )}
      {children}
    </div>
  );
}

export function KV({ data }) {
  const entries = Object.entries(data).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return <div className="muted small">No data.</div>;
  return (
    <dl className="kv">
      {entries.map(([k, v]) => (
        <React.Fragment key={k}>
          <dt>{humanize(k)}</dt>
          <dd>{renderVal(v)}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

export function Stat({ n, l, tone }) {
  return (
    <div className={`stat ${tone || ''}`}>
      <div className="n">{n}</div>
      <div className="l">{l}</div>
    </div>
  );
}

export function Badge({ tone = 'n', children }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

function renderVal(v) {
  if (Array.isArray(v)) {
    if (!v.length) return <span className="muted">—</span>;
    return (
      <div className="tags">
        {v.map((x, i) => (
          <span className="tag" key={i}>
            {typeof x === 'object' ? JSON.stringify(x) : String(x)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof v === 'object') return <span className="mono">{JSON.stringify(v)}</span>;
  if (typeof v === 'boolean') return v ? 'yes' : 'no';
  return String(v);
}

export function humanize(k) {
  return k
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bId\b/, 'ID')
    .replace(/\bIp\b/, 'IP')
    .replace(/\bDns\b/, 'DNS')
    .replace(/\bSsl\b/, 'SSL')
    .replace(/\bAsn\b/, 'ASN')
    .replace(/\bUrl\b/, 'URL');
}

// A labeled search form used across the tool pages.
export function LookupForm({ label, placeholder, onSubmit, loading, initial = '', buttonText = 'Investigate' }) {
  const [value, setValue] = useState(initial);
  return (
    <form
      className="input-row"
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit(value.trim());
      }}
    >
      <div className="field">
        <label>{label}</label>
        <input
          className="input"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <button className="btn btn-primary" disabled={loading || !value.trim()}>
        {loading ? <span className="spinner" /> : '⚡'} {buttonText}
      </button>
    </form>
  );
}
