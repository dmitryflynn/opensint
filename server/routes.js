import { Router } from 'express';
import { detect } from './services/detect.js';
import { dnsRecords } from './services/dns.js';
import { whoisLookup } from './services/whois.js';
import { sslCertificate } from './services/ssl.js';
import { subdomains } from './services/subdomains.js';
import { ipIntel } from './services/ipinfo.js';
import { emailIntel } from './services/email.js';
import { passwordExposure } from './services/breach.js';
import { usernameSearch } from './services/username.js';
import { hashReport, scanFile } from './services/virustotal.js';
import {
  listInvestigations,
  getInvestigation,
  saveInvestigation,
  deleteInvestigation,
} from './services/store.js';
import { keyStatus } from './config.js';

export const api = Router();

// Small helper so every handler returns a consistent envelope and errors
// never crash the process.
const wrap = (fn) => async (req, res) => {
  try {
    const data = await fn(req, res);
    if (!res.headersSent) res.json({ ok: true, data });
  } catch (err) {
    res.status(err.status || 500).json({ ok: false, error: err.message || 'Internal error' });
  }
};

function requireQuery(req, name) {
  const v = (req.query[name] ?? req.body?.[name] ?? '').toString().trim();
  if (!v) {
    const e = new Error(`Missing required parameter: ${name}`);
    e.status = 400;
    throw e;
  }
  return v;
}

// ── Meta ──
api.get('/health', wrap(async () => ({ status: 'ok', time: new Date().toISOString() })));
api.get('/config', wrap(async () => ({ integrations: keyStatus() })));

// ── Universal detection ──
api.get('/detect', wrap(async (req) => detect(requireQuery(req, 'q'))));

// ── Domain intelligence ──
api.get('/domain/dns', wrap(async (req) => dnsRecords(requireQuery(req, 'domain'))));
api.get('/domain/whois', wrap(async (req) => whoisLookup(requireQuery(req, 'domain'))));
api.get('/domain/ssl', wrap(async (req) => sslCertificate(requireQuery(req, 'domain'))));
api.get('/domain/subdomains', wrap(async (req) => subdomains(requireQuery(req, 'domain'))));
api.get(
  '/domain',
  wrap(async (req) => {
    const domain = requireQuery(req, 'domain');
    const [dns, whois, ssl, subs] = await Promise.all([
      dnsRecords(domain).catch((e) => ({ error: e.message })),
      whoisLookup(domain).catch((e) => ({ error: e.message })),
      sslCertificate(domain).catch((e) => ({ error: e.message })),
      subdomains(domain).catch((e) => ({ error: e.message })),
    ]);
    return { domain, dns, whois, ssl, subdomains: subs };
  })
);

// ── IP intelligence ──
api.get('/ip', wrap(async (req) => ipIntel(requireQuery(req, 'ip'))));

// ── Email intelligence ──
api.get('/email', wrap(async (req) => emailIntel(requireQuery(req, 'email'))));

// ── Password exposure (k-anonymity; count only) ──
api.post('/password/check', wrap(async (req) => passwordExposure(requireQuery(req, 'password'))));

// ── Username enumeration ──
api.get('/username', wrap(async (req) => usernameSearch(requireQuery(req, 'username'))));

// ── Hash / file reputation ──
api.get('/hash', wrap(async (req) => hashReport(requireQuery(req, 'hash'))));
api.post(
  '/file/scan',
  wrap(async (req) => {
    // Expects raw body (application/octet-stream) with X-Filename header.
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
      const e = new Error('No file body received. POST raw bytes as application/octet-stream.');
      e.status = 400;
      throw e;
    }
    return scanFile(buf, req.get('X-Filename'));
  })
);

// ── Investigation boards ──
api.get('/investigations', wrap(async () => listInvestigations()));
api.get('/investigations/:id', wrap(async (req) => {
  const inv = await getInvestigation(req.params.id);
  if (!inv) {
    const e = new Error('Investigation not found');
    e.status = 404;
    throw e;
  }
  return inv;
}));
api.post('/investigations', wrap(async (req) => saveInvestigation(req.body || {})));
api.delete('/investigations/:id', wrap(async (req) => {
  const ok = await deleteInvestigation(req.params.id);
  if (!ok) {
    const e = new Error('Investigation not found');
    e.status = 404;
    throw e;
  }
  return { deleted: true };
}));
