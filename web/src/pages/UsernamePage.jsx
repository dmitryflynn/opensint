import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLookup, LookupForm, Card, Spinner, ErrorBox, EmptyState, Badge } from '../components.jsx';
import PinButton from './PinButton.jsx';

export default function UsernamePage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { status, data, error, run } = useLookup(api.username);

  useEffect(() => {
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const found = data?.results?.filter((r) => r.found === true) || [];
  const maybe = data?.results?.filter((r) => r.found === null) || [];
  const missing = data?.results?.filter((r) => r.found === false) || [];

  return (
    <div>
      <div className="page-head">
        <h1>Username Search</h1>
        <p>Check whether a handle exists across 18+ platforms. Results marked “indeterminate” usually mean the platform blocks automated requests — verify those manually.</p>
      </div>

      <div className="card">
        <LookupForm label="Username / handle" placeholder="johndoe" initial={q} loading={status === 'loading'} onSubmit={(v) => setParams({ q: v })} buttonText="Search" />
      </div>

      {status === 'loading' && <Card title="Scanning platforms"><Spinner label="Checking 18+ sites…" /></Card>}
      {status === 'error' && <ErrorBox>{error}</ErrorBox>}
      {status === 'idle' && <EmptyState icon="👤" title="Enter a username to begin" />}

      {status === 'done' && data && (
        <>
          <div className="row between mb">
            <span className="mono muted">@{data.username}</span>
            <PinButton entity={{ type: 'username', value: data.username, label: `@${data.username}` }} />
          </div>

          <div className="stats mb">
            <div className="stat good"><div className="n">{found.length}</div><div className="l">Found</div></div>
            <div className="stat warn"><div className="n">{maybe.length}</div><div className="l">Indeterminate</div></div>
            <div className="stat"><div className="n">{missing.length}</div><div className="l">Not found</div></div>
            <div className="stat accent"><div className="n">{data.checked}</div><div className="l">Platforms checked</div></div>
          </div>

          <Card title="Found accounts" right={<Badge tone="g">{found.length}</Badge>}>
            {found.length ? (
              <div className="grid grid-3">
                {found.map((r) => (
                  <a className="list-row" href={r.url} target="_blank" rel="noreferrer" key={r.site}>
                    <div className="meta">
                      <span className="dot on" />
                      <div>
                        <div className="title">{r.site}</div>
                        <div className="sub">{r.category}</div>
                      </div>
                    </div>
                    <span className="small">↗</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="muted small">No confirmed accounts.</div>
            )}
          </Card>

          {maybe.length > 0 && (
            <Card title="Indeterminate (verify manually)" right={<Badge tone="w">{maybe.length}</Badge>}>
              <div className="grid grid-3">
                {maybe.map((r) => (
                  <a className="list-row" href={r.url} target="_blank" rel="noreferrer" key={r.site}>
                    <div className="meta"><span className="dot off" /><div className="title">{r.site}</div></div>
                    <span className="small muted">{r.status || '?'} ↗</span>
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card title="Not found" right={<Badge>{missing.length}</Badge>}>
            <div className="tags">{missing.map((r) => <span className="tag" key={r.site}>{r.site}</span>)}</div>
          </Card>
        </>
      )}
    </div>
  );
}
