import React, { useEffect, useState } from 'react';
import { api } from '../api.js';
import { Card, Badge } from '../components.jsx';

export default function About() {
  const [integrations, setIntegrations] = useState({});
  useEffect(() => {
    api.config().then((c) => setIntegrations(c.integrations)).catch(() => {});
  }, []);

  const rows = [
    ['HIBP (haveibeenpwned)', 'hibp', 'Breach exposure for emails', 'https://haveibeenpwned.com/API/Key'],
    ['VirusTotal', 'virustotal', 'File & hash reputation (70+ engines)', 'https://www.virustotal.com/gui/my-apikey'],
    ['AbuseIPDB', 'abuseipdb', 'IP abuse reputation scoring', 'https://www.abuseipdb.com/account/api'],
    ['Shodan', 'shodan', 'Open ports & exposed services', 'https://account.shodan.io/'],
    ['IPinfo', 'ipinfo', 'Richer IP geolocation (optional)', 'https://ipinfo.io/account/token'],
  ];

  return (
    <div>
      <div className="page-head">
        <h1>About OpenSINT</h1>
        <p>An open-source, self-hostable intelligence workbench. Free forever, MIT licensed, no account required.</p>
      </div>

      <Card title="What runs with zero configuration">
        <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
          Domain intelligence (WHOIS, DNS, TLS, subdomains via Certificate Transparency), IP geolocation, Gravatar
          lookups, username enumeration across 18+ platforms, and password exposure (Pwned Passwords k-anonymity) all
          work immediately with no API keys — they use public data sources.
        </p>
      </Card>

      <Card title="Optional integrations">
        <div className="list">
          {rows.map(([name, key, desc, url]) => (
            <div className="list-row" key={key}>
              <div className="meta">
                <span className={`dot ${integrations[key] ? 'on' : 'off'}`} />
                <div>
                  <div className="title">{name}</div>
                  <div className="sub">{desc}</div>
                </div>
              </div>
              <div className="row" style={{ gap: 10 }}>
                {integrations[key] ? <Badge tone="g">enabled</Badge> : <Badge>not set</Badge>}
                <a className="small" href={url} target="_blank" rel="noreferrer">Get key ↗</a>
              </div>
            </div>
          ))}
        </div>
        <div className="note-box mt">
          Add keys to a <span className="mono">.env</span> file in the project root (copy <span className="mono">.env.example</span>) and restart the server.
        </div>
      </Card>

      <Card title="Ethics & scope">
        <p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>
          OpenSINT deliberately exposes <strong>defensive</strong> breach signals only — which breaches an identifier
          appears in — and never serves plaintext credentials, cookies or session data. It is intended for security
          research, attack-surface assessment and authorised investigations. Respect each upstream provider’s terms and
          your local laws.
        </p>
      </Card>

      <div className="muted small" style={{ textAlign: 'center', marginTop: 30 }}>
        OpenSINT · MIT License · Not affiliated with any commercial OSINT provider.
      </div>
    </div>
  );
}
