import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, useNavigate, Link } from 'react-router-dom';
import { api } from './api.js';
import Home from './pages/Home.jsx';
import DomainPage from './pages/DomainPage.jsx';
import IpPage from './pages/IpPage.jsx';
import EmailPage from './pages/EmailPage.jsx';
import UsernamePage from './pages/UsernamePage.jsx';
import HashPage from './pages/HashPage.jsx';
import PasswordPage from './pages/PasswordPage.jsx';
import Investigations from './pages/Investigations.jsx';
import Board from './pages/Board.jsx';
import About from './pages/About.jsx';

const Logo = () => (
  <svg viewBox="0 0 32 32" aria-hidden>
    <rect width="32" height="32" rx="7" fill="#0f141d" />
    <circle cx="15" cy="15" r="8" fill="none" stroke="#38e0c8" strokeWidth="2" />
    <circle cx="15" cy="15" r="2.5" fill="#38e0c8" />
    <path d="M21 21 L27 27" stroke="#38e0c8" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const NAV = [
  { section: 'Discover' },
  { to: '/', label: 'Dashboard', ico: '◎', end: true },
  { to: '/domain', label: 'Domain', ico: '🌐' },
  { to: '/ip', label: 'IP Address', ico: '📡' },
  { to: '/email', label: 'Email', ico: '✉' },
  { to: '/username', label: 'Username', ico: '👤' },
  { to: '/hash', label: 'File / Hash', ico: '🧬' },
  { to: '/password', label: 'Password', ico: '🔑' },
  { section: 'Workspace' },
  { to: '/investigations', label: 'Investigations', ico: '🕸' },
  { to: '/about', label: 'About', ico: 'ⓘ' },
];

// Universal search — detects the entity type and routes to the right module.
function UniversalSearch() {
  const [q, setQ] = useState('');
  const [chip, setChip] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const v = q.trim();
    if (!v) return setChip(null);
    const t = setTimeout(async () => {
      try {
        const d = await api.detect(v);
        setChip(d.type === 'unknown' ? null : d);
      } catch {
        setChip(null);
      }
    }, 220);
    return () => clearTimeout(t);
  }, [q]);

  const go = (e) => {
    e.preventDefault();
    if (!chip) return;
    const routes = {
      domain: '/domain',
      ip: '/ip',
      email: '/email',
      username: '/username',
      hash: '/hash',
      phone: '/username',
    };
    const path = routes[chip.type];
    if (path) navigate(`${path}?q=${encodeURIComponent(chip.value)}`);
  };

  return (
    <form className="usearch" onSubmit={go}>
      <span className="search-ico">⌕</span>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search any identifier — email, domain, IP, username, hash…"
        autoComplete="off"
        spellCheck={false}
      />
      {chip && <span className="detect-chip">{chip.type}</span>}
    </form>
  );
}

export default function App() {
  const [integrations, setIntegrations] = useState(null);
  useEffect(() => {
    api.config().then((c) => setIntegrations(c.integrations)).catch(() => {});
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <Link to="/" className="brand" style={{ textDecoration: 'none' }}>
          <Logo />
          <div>
            <div className="brand-name">
              Open<span className="dim">SINT</span>
            </div>
            <div className="brand-tag">Intel Workbench</div>
          </div>
        </Link>
        <nav className="nav">
          {NAV.map((item, i) =>
            item.section ? (
              <div className="nav-label" key={i}>
                {item.section}
              </div>
            ) : (
              <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => (isActive ? 'active' : '')}>
                <span className="ico">{item.ico}</span>
                {item.label}
              </NavLink>
            )
          )}
        </nav>
        {integrations && (
          <div style={{ marginTop: 24, padding: '0 10px' }}>
            <div className="nav-label" style={{ padding: '4px 0 8px' }}>
              Integrations
            </div>
            {Object.entries(integrations).map(([k, on]) => (
              <div className="integ" key={k} style={{ marginBottom: 6 }}>
                <span className={`dot ${on ? 'on' : 'off'}`} />
                <span style={{ color: on ? 'var(--text)' : 'var(--faint)' }}>{k}</span>
              </div>
            ))}
          </div>
        )}
      </aside>

      <div className="main">
        <header className="topbar">
          <UniversalSearch />
          <a className="btn btn-ghost btn-sm" href="https://github.com" target="_blank" rel="noreferrer">
            ★ GitHub
          </a>
        </header>
        <main className="content">
          <Routes>
            <Route path="/" element={<Home integrations={integrations} />} />
            <Route path="/domain" element={<DomainPage />} />
            <Route path="/ip" element={<IpPage />} />
            <Route path="/email" element={<EmailPage />} />
            <Route path="/username" element={<UsernamePage />} />
            <Route path="/hash" element={<HashPage />} />
            <Route path="/password" element={<PasswordPage />} />
            <Route path="/investigations" element={<Investigations />} />
            <Route path="/investigations/:id" element={<Board />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<Home integrations={integrations} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
