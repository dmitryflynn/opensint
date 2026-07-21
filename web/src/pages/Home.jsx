import React from 'react';
import { Link } from 'react-router-dom';

const MODULES = [
  { to: '/domain', ico: '🌐', title: 'Domain Intelligence', desc: 'WHOIS, live DNS records, TLS certificate details and passive subdomain discovery.' },
  { to: '/ip', ico: '📡', title: 'IP Intelligence', desc: 'Geolocation, ASN & ISP, abuse reputation and exposed services for any address.' },
  { to: '/email', ico: '✉', title: 'Email Intelligence', desc: 'Gravatar profile, linked accounts and breach exposure across known leaks.' },
  { to: '/username', ico: '👤', title: 'Username Search', desc: 'Enumerate a handle across 120+ platforms — social, dev, gaming and more.' },
  { to: '/hash', ico: '🧬', title: 'File & Hash Analysis', desc: 'Reputation across 70+ antivirus engines by MD5 / SHA-1 / SHA-256 or upload.' },
  { to: '/password', ico: '🔑', title: 'Password Exposure', desc: 'k-anonymity check against billions of breached passwords — count only.' },
  { to: '/investigations', ico: '🕸', title: 'Investigation Boards', desc: 'Link entities into a visual graph and build a connected case picture.' },
];

export default function Home({ integrations }) {
  const enabled = integrations ? Object.values(integrations).filter(Boolean).length : 0;
  const total = integrations ? Object.keys(integrations).length : 0;
  return (
    <div>
      <div className="page-head">
        <h1>Intelligence Workbench</h1>
        <p>
          A unified OSINT console. Start from the universal search bar above, or jump straight into a module.
          Every entity you find can be pinned to an investigation board to map the connections.
        </p>
      </div>

      <div className="stats mb">
        <div className="stat accent">
          <div className="n">7</div>
          <div className="l">Intelligence modules</div>
        </div>
        <div className="stat">
          <div className="n">120+</div>
          <div className="l">Username platforms</div>
        </div>
        <div className="stat good">
          <div className="n">{enabled}/{total || '—'}</div>
          <div className="l">Integrations enabled</div>
        </div>
        <div className="stat">
          <div className="n">0</div>
          <div className="l">API cost (self-hosted)</div>
        </div>
      </div>

      <div className="module-grid">
        {MODULES.map((m) => (
          <Link key={m.to} to={m.to} className="module">
            <div className="m-ico">{m.ico}</div>
            <div className="m-title">{m.title}</div>
            <div className="m-desc">{m.desc}</div>
          </Link>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <div className="card-head">
          <h3>🔒 Responsible use</h3>
        </div>
        <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
          OpenSINT aggregates <strong>publicly available</strong> information and defensive exposure signals
          (which breaches an identifier appears in — never plaintext passwords or session data). Use it for
          security research, footprint assessment and authorised investigations. You are responsible for
          complying with the terms of each upstream data source and with applicable law.
        </p>
      </div>
    </div>
  );
}
