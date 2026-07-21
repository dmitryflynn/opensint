// Identifier type detection — the heart of the "universal search" box.
// Given an arbitrary string, decide what kind of entity it is so the
// front end can route it to the right intelligence module.

const RE = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ipv4: /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/,
  ipv6: /^(([0-9a-f]{1,4}:){7}[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,7}:|([0-9a-f]{1,4}:){1,6}:[0-9a-f]{1,4}|([0-9a-f]{1,4}:){1,5}(:[0-9a-f]{1,4}){1,2}|([0-9a-f]{1,4}:){1,4}(:[0-9a-f]{1,4}){1,3}|([0-9a-f]{1,4}:){1,3}(:[0-9a-f]{1,4}){1,4}|([0-9a-f]{1,4}:){1,2}(:[0-9a-f]{1,4}){1,5}|[0-9a-f]{1,4}:((:[0-9a-f]{1,4}){1,6})|:((:[0-9a-f]{1,4}){1,7}|:))$/i,
  md5: /^[a-f0-9]{32}$/i,
  sha1: /^[a-f0-9]{40}$/i,
  sha256: /^[a-f0-9]{64}$/i,
  domain: /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/i,
  phone: /^\+?[0-9][0-9\s().-]{6,17}[0-9]$/,
  url: /^https?:\/\/.+/i,
};

/**
 * @returns {{ type: string, value: string, hashType?: string, confidence: number }}
 */
export function detect(raw) {
  const value = String(raw || '').trim();
  if (!value) return { type: 'unknown', value, confidence: 0 };

  if (RE.url.test(value)) {
    try {
      const host = new URL(value).hostname;
      return { type: 'domain', value: host, confidence: 0.9, note: 'extracted host from URL' };
    } catch {
      /* fall through */
    }
  }
  if (RE.email.test(value)) return { type: 'email', value: value.toLowerCase(), confidence: 1 };
  if (RE.ipv4.test(value)) return { type: 'ip', value, confidence: 1, ipVersion: 4 };
  if (RE.ipv6.test(value)) return { type: 'ip', value, confidence: 0.95, ipVersion: 6 };
  if (RE.md5.test(value)) return { type: 'hash', value: value.toLowerCase(), hashType: 'md5', confidence: 1 };
  if (RE.sha1.test(value)) return { type: 'hash', value: value.toLowerCase(), hashType: 'sha1', confidence: 1 };
  if (RE.sha256.test(value)) return { type: 'hash', value: value.toLowerCase(), hashType: 'sha256', confidence: 1 };
  if (RE.domain.test(value)) return { type: 'domain', value: value.toLowerCase(), confidence: 0.9 };
  // A phone must be mostly digits and not look like a bare number/username.
  if (RE.phone.test(value) && (value.match(/\d/g) || []).length >= 7) {
    return { type: 'phone', value: value.replace(/[^\d+]/g, ''), confidence: 0.8 };
  }
  // Anything else that is a reasonable handle → treat as a username.
  if (/^[a-z0-9_.-]{2,40}$/i.test(value)) return { type: 'username', value, confidence: 0.6 };

  return { type: 'unknown', value, confidence: 0 };
}
