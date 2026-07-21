import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLookup, LookupForm, Card, KV, Spinner, ErrorBox, EmptyState, Badge } from '../components.jsx';
import PinButton from './PinButton.jsx';

export default function IpPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { status, data, error, run } = useLookup(api.ip);

  useEffect(() => {
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const rep = data?.reputation;
  const score = rep?.abuseConfidenceScore;

  return (
    <div>
      <div className="page-head">
        <h1>IP Intelligence</h1>
        <p>Geolocation, ASN & ISP ownership, abuse reputation and exposed services. Free geolocation works out of the box; add AbuseIPDB and Shodan keys for reputation and open ports.</p>
      </div>

      <div className="card">
        <LookupForm label="IP address" placeholder="8.8.8.8" initial={q} loading={status === 'loading'} onSubmit={(v) => setParams({ q: v })} />
      </div>

      {status === 'loading' && <Card title="Resolving"><Spinner label="Geolocating and checking reputation…" /></Card>}
      {status === 'error' && <ErrorBox>{error}</ErrorBox>}
      {status === 'idle' && <EmptyState icon="📡" title="Enter an IP address to begin" />}

      {status === 'done' && data && (
        <>
          <div className="row between mb">
            <span className="mono muted">{data.ip}</span>
            <PinButton entity={{ type: 'ip', value: data.ip, label: data.ip }} />
          </div>

          {typeof score === 'number' && (
            <div className="stats mb">
              <div className={`stat ${score >= 50 ? 'danger' : score > 0 ? 'warn' : 'good'}`}>
                <div className="n">{score}%</div>
                <div className="l">Abuse confidence</div>
              </div>
              <div className="stat"><div className="n">{rep.totalReports ?? 0}</div><div className="l">Abuse reports</div></div>
              {data.ports?.ports && <div className="stat accent"><div className="n">{data.ports.ports.length}</div><div className="l">Open ports</div></div>}
              {rep.isTor !== undefined && <div className="stat"><div className="n">{rep.isTor ? 'Yes' : 'No'}</div><div className="l">Tor exit node</div></div>}
            </div>
          )}

          <div className="grid grid-2">
            <Card title="Geolocation & Network" source={data.geo?.source}>
              {data.geo?.error ? <div className="muted small">{data.geo.error}</div> : <KV data={omit(data.geo, ['source'])} />}
            </Card>

            <Card title="Reputation" source={rep?.source}>
              {rep?.configured === false ? (
                <div className="muted small">Add an <span className="mono">ABUSEIPDB_API_KEY</span> to enable reputation scoring.</div>
              ) : rep?.error ? (
                <div className="muted small">{rep.error}</div>
              ) : (
                <KV data={omit(rep, ['source', 'configured'])} />
              )}
            </Card>
          </div>

          <Card title="Exposed Services" source={data.ports?.source} right={data.ports?.ports && <Badge tone="a">{data.ports.ports.length} ports</Badge>}>
            {data.ports?.configured === false ? (
              <div className="muted small">Add a <span className="mono">SHODAN_API_KEY</span> to reveal open ports and exposed services.</div>
            ) : data.ports?.error ? (
              <div className="muted small">{data.ports.error}</div>
            ) : data.ports?.ports?.length ? (
              <>
                <div className="tags mb">{data.ports.ports.map((p) => <span className="tag" key={p}>{p}</span>)}</div>
                {data.ports.vulns?.length > 0 && (
                  <div className="mt">
                    <div className="small muted mb">Known vulnerabilities</div>
                    <div className="tags">{data.ports.vulns.map((v) => <span className="tag" key={v} style={{ color: 'var(--danger)' }}>{v}</span>)}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="muted small">{data.ports?.note || 'No open ports reported.'}</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function omit(obj, keys) {
  if (!obj) return {};
  const out = { ...obj };
  keys.forEach((k) => delete out[k]);
  return out;
}
