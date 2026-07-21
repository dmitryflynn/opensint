import { httpJson, httpRaw } from './http.js';
import { config } from '../config.js';
import crypto from 'node:crypto';

// Breach EXPOSURE checking — the defensible OSINT primitive. We report
// WHICH breaches an identifier appears in (so a person can assess their
// own exposure), never plaintext passwords or session data.

export async function emailBreaches(email) {
  if (!config.keys.hibp) {
    return {
      source: 'haveibeenpwned',
      configured: false,
      note: 'Set HIBP_API_KEY to enable breach exposure lookups.',
      breaches: [],
    };
  }
  try {
    const res = await httpRaw(
      `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(
        email
      )}?truncateResponse=false`,
      { headers: { 'hibp-api-key': config.keys.hibp } }
    );
    if (res.status === 404) {
      return { source: 'haveibeenpwned', configured: true, breaches: [], count: 0 };
    }
    if (!res.ok) {
      return { source: 'haveibeenpwned', configured: true, error: `status ${res.status}`, breaches: [] };
    }
    const data = await res.json();
    const breaches = (data || []).map((b) => ({
      name: b.Name,
      title: b.Title,
      domain: b.Domain,
      breachDate: b.BreachDate,
      pwnCount: b.PwnCount,
      dataClasses: b.DataClasses,
      isVerified: b.IsVerified,
      isSensitive: b.IsSensitive,
    }));
    return { source: 'haveibeenpwned', configured: true, breaches, count: breaches.length };
  } catch (err) {
    return { source: 'haveibeenpwned', configured: true, error: err.message, breaches: [] };
  }
}

// Pwned Passwords uses k-anonymity: only the first 5 chars of the SHA-1
// hash ever leave this server, and we report a COUNT of appearances only.
// This helps a user learn if a password they own is compromised — it never
// reveals anyone's password.
export async function passwordExposure(plaintext) {
  const sha1 = crypto.createHash('sha1').update(plaintext, 'utf8').digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  try {
    const res = await httpRaw(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { 'Add-Padding': 'true' },
    });
    if (!res.ok) return { source: 'pwnedpasswords', error: `status ${res.status}` };
    const body = await res.text();
    for (const line of body.split('\n')) {
      const [hashSuffix, count] = line.trim().split(':');
      if (hashSuffix === suffix) {
        return { source: 'pwnedpasswords', compromised: true, count: Number(count) };
      }
    }
    return { source: 'pwnedpasswords', compromised: false, count: 0 };
  } catch (err) {
    return { source: 'pwnedpasswords', error: err.message };
  }
}
