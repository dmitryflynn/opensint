import { httpJson } from './http.js';

// Passive subdomain discovery via crt.sh (Certificate Transparency logs).
// This is fully public data — every publicly trusted TLS cert is logged.
export async function subdomains(domain) {
  try {
    const { ok, json } = await httpJson(
      `https://crt.sh/?q=${encodeURIComponent('%.' + domain)}&output=json`,
      { timeout: 15000 }
    );
    if (!ok || !Array.isArray(json)) return { source: 'crt.sh', subdomains: [], count: 0 };

    const set = new Set();
    for (const row of json) {
      const names = String(row.name_value || '').split('\n');
      for (let name of names) {
        name = name.trim().toLowerCase().replace(/^\*\./, '');
        if (name.endsWith(domain) && name !== domain) set.add(name);
      }
    }
    const list = [...set].sort();
    return { source: 'crt.sh', subdomains: list, count: list.length };
  } catch (err) {
    return { source: 'crt.sh', subdomains: [], count: 0, error: err.message };
  }
}
