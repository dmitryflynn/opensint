import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLookup, LookupForm, Card, Spinner, ErrorBox, EmptyState, Badge, KV } from '../components.jsx';
import PinButton from './PinButton.jsx';

export default function EmailPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { status, data, error, run } = useLookup(api.email);

  useEffect(() => {
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const grav = data?.gravatar;
  const breaches = data?.breaches;

  return (
    <div>
      <div className="page-head">
        <h1>Email Intelligence</h1>
        <p>Public Gravatar profile, linked social accounts and breach exposure. Add a HaveIBeenPwned key to enable breach lookups.</p>
      </div>

      <div className="card">
        <LookupForm label="Email address" placeholder="name@example.com" initial={q} loading={status === 'loading'} onSubmit={(v) => setParams({ q: v })} />
      </div>

      {status === 'loading' && <Card title="Investigating"><Spinner /></Card>}
      {status === 'error' && <ErrorBox>{error}</ErrorBox>}
      {status === 'idle' && <EmptyState icon="✉" title="Enter an email address to begin" />}

      {status === 'done' && data && (
        <>
          <div className="row between mb">
            <span className="mono muted">{data.email}</span>
            <PinButton entity={{ type: 'email', value: data.email, label: data.email }} />
          </div>

          <div className="grid grid-2">
            <Card title="Gravatar Profile" source="gravatar.com">
              {grav?.exists ? (
                <div>
                  <div className="row mb" style={{ gap: 14 }}>
                    <img src={grav.avatar} alt="avatar" width={64} height={64} style={{ borderRadius: 12, border: '1px solid var(--border)' }} />
                    <div>
                      <div style={{ fontWeight: 650, fontSize: 16 }}>{grav.displayName || '—'}</div>
                      {grav.location && <div className="muted small">{grav.location}</div>}
                      {grav.profileUrl && <a className="small" href={grav.profileUrl} target="_blank" rel="noreferrer">View profile ↗</a>}
                    </div>
                  </div>
                  {grav.aboutMe && <p className="muted small">{grav.aboutMe}</p>}
                  {grav.accounts?.length > 0 && (
                    <div className="mt">
                      <div className="small muted mb">Linked accounts</div>
                      <div className="list">
                        {grav.accounts.map((a) => (
                          <div className="list-row" key={a.url}>
                            <span className="title">{a.name}</span>
                            <a className="small" href={a.url} target="_blank" rel="noreferrer">{a.username || 'open'} ↗</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="muted small">No public Gravatar profile for this address.</div>
              )}
            </Card>

            <Card title="Breach Exposure" source={breaches?.source} right={breaches?.count != null && <Badge tone={breaches.count ? 'r' : 'g'}>{breaches.count} breaches</Badge>}>
              {breaches?.configured === false ? (
                <div className="note-box">{breaches.note}</div>
              ) : breaches?.error ? (
                <div className="muted small">{breaches.error}</div>
              ) : breaches?.breaches?.length ? (
                <div className="list">
                  {breaches.breaches.map((b) => (
                    <div className="card" key={b.name} style={{ margin: 0, padding: 13, background: 'var(--panel-2)' }}>
                      <div className="row between mb">
                        <div className="row" style={{ gap: 8 }}>
                          <strong>{b.title}</strong>
                          {b.isSensitive && <Badge tone="p">sensitive</Badge>}
                          {b.isVerified ? <Badge tone="g">verified</Badge> : <Badge tone="w">unverified</Badge>}
                        </div>
                        <span className="small muted">{b.breachDate}</span>
                      </div>
                      <div className="small muted mb">{b.pwnCount?.toLocaleString()} accounts · {b.domain}</div>
                      <div className="tags">{(b.dataClasses || []).map((c) => <span className="tag" key={c}>{c}</span>)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="row" style={{ gap: 8 }}><Badge tone="g">Clean</Badge><span className="muted small">Not found in any known breach.</span></div>
              )}
            </Card>
          </div>

          <Card title="Identifiers">
            <KV data={{ email: data.email, domain: data.domain, sha256: grav?.sha256 }} />
          </Card>
        </>
      )}
    </div>
  );
}
