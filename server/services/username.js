import { httpRaw } from './http.js';

// Username enumeration across popular platforms (a compact, Sherlock-style
// check). For each site we request the profile URL and decide "found" from
// the HTTP status and/or an absence marker in the body. This only touches
// public profile pages.
const SITES = [
  { name: 'GitHub', url: (u) => `https://github.com/${u}`, category: 'dev' },
  { name: 'GitLab', url: (u) => `https://gitlab.com/${u}`, category: 'dev' },
  { name: 'Reddit', url: (u) => `https://www.reddit.com/user/${u}/about.json`, category: 'social', json: true, found: (j) => j?.data?.name },
  { name: 'Instagram', url: (u) => `https://www.instagram.com/${u}/`, category: 'social' },
  { name: 'X / Twitter', url: (u) => `https://x.com/${u}`, category: 'social' },
  { name: 'Telegram', url: (u) => `https://t.me/${u}`, category: 'social', absent: 'tgme_page_extra' },
  { name: 'Twitch', url: (u) => `https://m.twitch.tv/${u}`, category: 'stream' },
  { name: 'Pinterest', url: (u) => `https://www.pinterest.com/${u}/`, category: 'social' },
  { name: 'Steam', url: (u) => `https://steamcommunity.com/id/${u}`, category: 'gaming', absent: 'The specified profile could not be found' },
  { name: 'Medium', url: (u) => `https://medium.com/@${u}`, category: 'blog' },
  { name: 'Dev.to', url: (u) => `https://dev.to/${u}`, category: 'dev' },
  { name: 'HackerNews', url: (u) => `https://news.ycombinator.com/user?id=${u}`, category: 'dev', absent: 'No such user.' },
  { name: 'Keybase', url: (u) => `https://keybase.io/${u}`, category: 'dev' },
  { name: 'Replit', url: (u) => `https://replit.com/@${u}`, category: 'dev' },
  { name: 'SoundCloud', url: (u) => `https://soundcloud.com/${u}`, category: 'music' },
  { name: 'Spotify', url: (u) => `https://open.spotify.com/user/${u}`, category: 'music' },
  { name: 'Patreon', url: (u) => `https://www.patreon.com/${u}`, category: 'social' },
  { name: 'TryHackMe', url: (u) => `https://tryhackme.com/p/${u}`, category: 'security' },
];

async function checkSite(site, username) {
  const url = site.url(username);
  try {
    const res = await httpRaw(url, {
      timeout: 9000,
      redirect: 'manual',
      headers: { Accept: 'text/html,application/json' },
    });
    // JSON-based checks (e.g. Reddit) parse the body.
    if (site.json) {
      if (res.status !== 200) return result(site, url, false, res.status);
      const j = await res.json().catch(() => null);
      return result(site, url, Boolean(site.found ? site.found(j) : j), res.status);
    }
    // A 3xx to a generic page usually means "not found" on many platforms.
    if (res.status >= 300 && res.status < 400) return result(site, url, false, res.status);
    if (res.status === 404 || res.status === 410) return result(site, url, false, res.status);
    if (res.status === 200 && site.absent) {
      const body = await res.text();
      return result(site, url, !body.includes(site.absent), res.status);
    }
    if (res.status === 200) return result(site, url, true, res.status);
    // 401/403/429 → indeterminate (many sites block bots).
    return result(site, url, null, res.status);
  } catch (err) {
    return result(site, url, null, 0, err.message);
  }
}

function result(site, url, found, status, error) {
  return { site: site.name, category: site.category, url, found, status, ...(error ? { error } : {}) };
}

export async function usernameSearch(username) {
  // Bound concurrency so we don't open 18 sockets at once.
  const results = [];
  const queue = [...SITES];
  const workers = Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const site = queue.shift();
      results.push(await checkSite(site, username));
    }
  });
  await Promise.all(workers);

  results.sort((a, b) => a.site.localeCompare(b.site));
  const found = results.filter((r) => r.found === true);
  return {
    username,
    checked: results.length,
    foundCount: found.length,
    results,
  };
}
