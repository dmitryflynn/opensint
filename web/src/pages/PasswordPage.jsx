import React, { useState } from 'react';
import { api } from '../api.js';
import { useLookup, Card, Spinner, ErrorBox } from '../components.jsx';

export default function PasswordPage() {
  const [value, setValue] = useState('');
  const { status, data, error, run } = useLookup(api.passwordCheck);

  return (
    <div>
      <div className="page-head">
        <h1>Password Exposure</h1>
        <p>Check whether a password appears in known breach corpora, using k-anonymity: only the first five characters of the SHA-1 hash ever leave your server, and the result is a count only — no password is ever transmitted or stored.</p>
      </div>

      <div className="card">
        <form
          className="input-row"
          onSubmit={(e) => {
            e.preventDefault();
            if (value) run(value);
          }}
        >
          <div className="field">
            <label>Password to check</label>
            <input className="input" type="password" value={value} placeholder="Type a password…" onChange={(e) => setValue(e.target.value)} autoComplete="off" />
          </div>
          <button className="btn btn-primary" disabled={status === 'loading' || !value}>
            {status === 'loading' ? <span className="spinner" /> : '🔑'} Check
          </button>
        </form>
        <div className="note-box mt">Your password is hashed locally-in-transit via k-anonymity. OpenSINT never logs or stores it.</div>
      </div>

      {status === 'loading' && <Card title="Checking"><Spinner /></Card>}
      {status === 'error' && <ErrorBox>{error}</ErrorBox>}

      {status === 'done' && data && (
        <Card title="Result" source={data.source}>
          {data.error ? (
            <ErrorBox>{data.error}</ErrorBox>
          ) : data.compromised ? (
            <div className="center-state">
              <div className="big">⚠</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--danger)' }}>Compromised</div>
              <div className="muted">This password has appeared <strong style={{ color: 'var(--danger)' }}>{data.count.toLocaleString()}</strong> times in known breaches. Do not use it.</div>
            </div>
          ) : (
            <div className="center-state">
              <div className="big">✓</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--good)' }}>Not found</div>
              <div className="muted">This password was not found in the Pwned Passwords corpus. That does not guarantee it is strong — length and uniqueness still matter.</div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
