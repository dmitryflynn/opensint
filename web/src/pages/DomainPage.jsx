import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLookup, LookupForm, Card, KV, Spinner, ErrorBox, EmptyState, Badge } from '../components.jsx';
import PinButton from './PinButton.jsx';

export default function DomainPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { status, data, error, run } = useLookup(api.domain);

  useEffect(() => {
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const submit = (v) => setParams({ q: v });

  return (
    <div>
      <div className="page-head">
        <h1>Domain Intelligence</h1>
        <p>WHOIS registration, live DNS records, TLS certificate and passive subdomain discovery — from public sources, no key required.</p>
      </div>

      <div className="card">
        <LookupForm label="Domain name" placeholder="example.com" initial={q} loading={status === 'loading'} onSubmit={submit} />
      </div>

      {status === 'loading' && <Card title="Gathering intelligence"><Spinner label="Querying WHOIS, DNS, TLS and CT logs…" /></Card>}
      {status === 'error' && <ErrorBox>{error}</ErrorBox>}
      {status === 'idle' && <EmptyState icon="🌐" title="Enter a domain to begin" />}

      {status === 'done' && data && (
        <>
          <div className="row between mb">
            <span className="mono muted">{data.domain}</span>
            <PinButton entity={{ type: 'domain', value: data.domain, label: data.domain }} />
          </div>

          <div className="grid grid-2">
            <Card title="WHOIS" source={data.whois?.server}>
              {data.whois?.error ? (
                <div className="muted small">{data.whois.error}</div>
              ) : (
                <KV data={data.whois?.parsed || {}} />
              )}
            </Card>

            <Card title="TLS Certificate">
              {data.ssl?.error ? (
                <div className="muted small">{data.ssl.error}</div>
              ) : (
                <>
                  <div className="row wrap mb" style={{ gap: 8 }}>
                    <Badge tone={data.ssl.expired ? 'r' : 'g'}>{data.ssl.expired ? 'Expired' : 'Valid'}</Badge>
                    {typeof data.ssl.daysUntilExpiry === 'number' && (
                      <Badge tone={data.ssl.daysUntilExpiry < 21 ? 'w' : 'n'}>{data.ssl.daysUntilExpiry} days left</Badge>
                    )}
                    {data.ssl.protocol && <Badge tone="a">{data.ssl.protocol}</Badge>}
                  </div>
                  <KV
                    data={{
                      issuer: data.ssl.issuer?.O || data.ssl.issuer?.CN,
                      subject: data.ssl.subject?.CN,
                      validFrom: data.ssl.validFrom,
                      validTo: data.ssl.validTo,
                      cipher: data.ssl.cipher,
                      fingerprint256: data.ssl.fingerprint256,
                      subjectAltNames: data.ssl.subjectAltNames,
                    }}
                  />
                </>
              )}
            </Card>
          </div>

          <Card title="DNS Records">
            {data.dns && Object.keys(data.dns).length ? <KV data={data.dns} /> : <div className="muted small">No records resolved.</div>}
          </Card>

          <Card
            title="Subdomains"
            source={data.subdomains?.source}
            right={<Badge tone="a">{data.subdomains?.count || 0} found</Badge>}
          >
            {data.subdomains?.error && <div className="muted small mb">{data.subdomains.error}</div>}
            {data.subdomains?.subdomains?.length ? (
              <div className="scrollbox">
                <div className="list" style={{ padding: 10 }}>
                  {data.subdomains.subdomains.map((s) => (
                    <div className="list-row" key={s}>
                      <span className="mono small">{s}</span>
                      <PinButton small entity={{ type: 'domain', value: s, label: s }} />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="muted small">No subdomains discovered in CT logs.</div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
