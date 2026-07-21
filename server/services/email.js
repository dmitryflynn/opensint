import crypto from 'node:crypto';
import { httpRaw } from './http.js';
import { emailBreaches } from './breach.js';

// Email intelligence: gravatar presence/profile, deliverability heuristics,
// and breach exposure. All from public sources.
export async function emailIntel(email) {
  const normalized = email.trim().toLowerCase();
  const [gravatar, breaches] = await Promise.all([gravatarProfile(normalized), emailBreaches(normalized)]);
  return {
    email: normalized,
    domain: normalized.split('@')[1],
    gravatar,
    breaches,
  };
}

async function gravatarProfile(email) {
  const hash = crypto.createHash('sha256').update(email).digest('hex');
  const md5 = crypto.createHash('md5').update(email).digest('hex');
  const avatar = `https://www.gravatar.com/avatar/${md5}?d=404`;
  try {
    // Gravatar's profile JSON endpoint (public profiles only).
    const res = await httpRaw(`https://www.gravatar.com/${md5}.json`, { timeout: 8000 });
    if (res.status === 404) return { exists: false, avatar };
    if (!res.ok) return { exists: false, avatar, note: `status ${res.status}` };
    const data = await res.json();
    const entry = data?.entry?.[0];
    if (!entry) return { exists: false, avatar };
    return {
      exists: true,
      avatar: entry.thumbnailUrl || avatar,
      displayName: entry.displayName,
      location: entry.currentLocation,
      aboutMe: entry.aboutMe,
      accounts: (entry.accounts || []).map((a) => ({ name: a.name, url: a.url, username: a.username })),
      profileUrl: entry.profileUrl,
      sha256: hash,
    };
  } catch (err) {
    return { exists: false, avatar, error: err.message };
  }
}
