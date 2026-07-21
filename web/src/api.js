// Thin API client. All requests go to the same-origin /api prefix, which
// Vite proxies to the backend in dev and Express serves in production.
const BASE = '/api';

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, opts);
  let body;
  try {
    body = await res.json();
  } catch {
    throw new Error(`Bad response (${res.status})`);
  }
  if (!res.ok || body.ok === false) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data;
}

export const api = {
  health: () => req('/health'),
  config: () => req('/config'),
  detect: (q) => req(`/detect?q=${encodeURIComponent(q)}`),
  domain: (domain) => req(`/domain?domain=${encodeURIComponent(domain)}`),
  domainDns: (domain) => req(`/domain/dns?domain=${encodeURIComponent(domain)}`),
  domainWhois: (domain) => req(`/domain/whois?domain=${encodeURIComponent(domain)}`),
  domainSsl: (domain) => req(`/domain/ssl?domain=${encodeURIComponent(domain)}`),
  ip: (ip) => req(`/ip?ip=${encodeURIComponent(ip)}`),
  email: (email) => req(`/email?email=${encodeURIComponent(email)}`),
  username: (username) => req(`/username?username=${encodeURIComponent(username)}`),
  hash: (hash) => req(`/hash?hash=${encodeURIComponent(hash)}`),
  passwordCheck: (password) =>
    req('/password/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    }),
  scanFile: (file) =>
    req('/file/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Filename': file.name },
      body: file,
    }),
  investigations: () => req('/investigations'),
  investigation: (id) => req(`/investigations/${id}`),
  saveInvestigation: (payload) =>
    req('/investigations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  deleteInvestigation: (id) => req(`/investigations/${id}`, { method: 'DELETE' }),
};
