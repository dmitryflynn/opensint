import { httpRaw } from './http.js';

// Username enumeration across popular platforms (a Sherlock/WhatsMyName-style
// check). For each site we request the public profile URL and decide "found"
// from the HTTP status and/or a marker in the body:
//   • json + found(j)  → parse the JSON body and test a predicate
//   • absent: 'text'   → a 200 that CONTAINS this "not found" marker means absent
//   • present: 'text'  → a 200 must CONTAIN this marker to count as found
//   • otherwise        → 200 = found, 404/410/redirect = absent
// Only public profile pages are touched. Sites that hard-block bots return
// 401/403/429 and are reported as "indeterminate" for manual verification.
const SITES = [
  // ── Developer & tech ──
  { name: 'GitHub', url: (u) => `https://github.com/${u}`, category: 'dev' },
  { name: 'GitLab', url: (u) => `https://gitlab.com/${u}`, category: 'dev' },
  { name: 'Bitbucket', url: (u) => `https://bitbucket.org/${u}/`, category: 'dev' },
  { name: 'Gitee', url: (u) => `https://gitee.com/${u}`, category: 'dev' },
  { name: 'SourceForge', url: (u) => `https://sourceforge.net/u/${u}/profile/`, category: 'dev' },
  { name: 'Launchpad', url: (u) => `https://launchpad.net/~${u}`, category: 'dev' },
  { name: 'Dev.to', url: (u) => `https://dev.to/${u}`, category: 'dev' },
  { name: 'Hashnode', url: (u) => `https://hashnode.com/@${u}`, category: 'dev', absent: 'User not found' },
  { name: 'Replit', url: (u) => `https://replit.com/@${u}`, category: 'dev' },
  { name: 'CodePen', url: (u) => `https://codepen.io/${u}`, category: 'dev' },
  { name: 'JSFiddle', url: (u) => `https://jsfiddle.net/user/${u}/`, category: 'dev' },
  { name: 'Docker Hub', url: (u) => `https://hub.docker.com/u/${u}`, category: 'dev' },
  { name: 'npm', url: (u) => `https://www.npmjs.com/~${u}`, category: 'dev' },
  { name: 'PyPI', url: (u) => `https://pypi.org/user/${u}/`, category: 'dev', present: 'Profile of' },
  { name: 'RubyGems', url: (u) => `https://rubygems.org/profiles/${u}`, category: 'dev' },
  { name: 'Packagist', url: (u) => `https://packagist.org/users/${u}/`, category: 'dev' },
  { name: 'Kaggle', url: (u) => `https://www.kaggle.com/${u}`, category: 'dev', soft: true },
  { name: 'HackerNews', url: (u) => `https://news.ycombinator.com/user?id=${u}`, category: 'dev', absent: 'No such user.' },
  { name: 'Keybase', url: (u) => `https://keybase.io/${u}`, category: 'dev' },
  { name: 'Stack Overflow', url: (u) => `https://stackoverflow.com/users/filter?search=${u}`, category: 'dev', soft: true },
  { name: 'Read the Docs', url: (u) => `https://readthedocs.org/profiles/${u}/`, category: 'dev' },
  { name: 'Codeberg', url: (u) => `https://codeberg.org/${u}`, category: 'dev' },

  // ── Competitive programming / security ──
  { name: 'LeetCode', url: (u) => `https://leetcode.com/${u}/`, category: 'security' },
  { name: 'HackerRank', url: (u) => `https://www.hackerrank.com/${u}`, category: 'security', absent: 'Programming Problems and Competitions' },
  { name: 'Codewars', url: (u) => `https://www.codewars.com/users/${u}`, category: 'security' },
  { name: 'Codeforces', url: (u) => `https://codeforces.com/profile/${u}`, category: 'security' },
  { name: 'CodeChef', url: (u) => `https://www.codechef.com/users/${u}`, category: 'security' },
  { name: 'Exercism', url: (u) => `https://exercism.org/profiles/${u}`, category: 'security' },
  { name: 'TryHackMe', url: (u) => `https://tryhackme.com/p/${u}`, category: 'security' },
  { name: 'HackTheBox', url: (u) => `https://app.hackthebox.com/users/${u}`, category: 'security', soft: true },
  { name: 'Root-Me', url: (u) => `https://www.root-me.org/${u}`, category: 'security', soft: true },
  { name: 'BugCrowd', url: (u) => `https://bugcrowd.com/${u}`, category: 'security' },
  { name: 'HackerOne', url: (u) => `https://hackerone.com/${u}`, category: 'security' },

  // ── Social networks ──
  { name: 'X / Twitter', url: (u) => `https://x.com/${u}`, category: 'social' },
  { name: 'Instagram', url: (u) => `https://www.instagram.com/${u}/`, category: 'social', present: 'Instagram photos and videos' },
  { name: 'Facebook', url: (u) => `https://www.facebook.com/${u}`, category: 'social', soft: true },
  { name: 'Reddit', url: (u) => `https://www.reddit.com/user/${u}/about.json`, category: 'social', json: true, found: (j) => j?.data?.name },
  { name: 'Pinterest', url: (u) => `https://www.pinterest.com/${u}/`, category: 'social', soft: true },
  { name: 'Tumblr', url: (u) => `https://${u}.tumblr.com`, category: 'social' },
  { name: 'TikTok', url: (u) => `https://www.tiktok.com/@${u}`, category: 'social', soft: true },
  { name: 'Threads', url: (u) => `https://www.threads.net/@${u}`, category: 'social' },
  { name: 'Telegram', url: (u) => `https://t.me/${u}`, category: 'social', present: 'tgme_page_extra' },
  { name: 'VK', url: (u) => `https://vk.com/${u}`, category: 'social' },
  { name: 'Bluesky', url: (u) => `https://bsky.app/profile/${u}.bsky.social`, category: 'social', present: 'on Bluesky' },
  { name: 'Mastodon (mastodon.social)', url: (u) => `https://mastodon.social/@${u}`, category: 'social' },
  { name: 'Linktree', url: (u) => `https://linktr.ee/${u}`, category: 'social' },
  { name: 'About.me', url: (u) => `https://about.me/${u}`, category: 'social' },
  { name: 'Disqus', url: (u) => `https://disqus.com/by/${u}/`, category: 'social' },
  { name: 'Minds', url: (u) => `https://www.minds.com/${u}`, category: 'social', soft: true },
  { name: 'Gravatar', url: (u) => `https://gravatar.com/${u}`, category: 'social' },
  { name: 'Ello', url: (u) => `https://ello.co/${u}`, category: 'social' },
  { name: 'Flipboard', url: (u) => `https://flipboard.com/@${u}`, category: 'social' },
  { name: 'Trello', url: (u) => `https://trello.com/${u}`, category: 'social', soft: true },
  { name: 'Xing', url: (u) => `https://www.xing.com/profile/${u}`, category: 'social' },
  { name: 'Foursquare', url: (u) => `https://foursquare.com/${u}`, category: 'social' },

  // ── Streaming, gaming & video ──
  { name: 'Twitch', url: (u) => `https://m.twitch.tv/${u}`, category: 'gaming', soft: true },
  { name: 'Steam', url: (u) => `https://steamcommunity.com/id/${u}`, category: 'gaming', absent: 'The specified profile could not be found' },
  { name: 'Roblox', url: (u) => `https://www.roblox.com/user.aspx?username=${u}`, category: 'gaming' },
  { name: 'Chess.com', url: (u) => `https://www.chess.com/member/${u}`, category: 'gaming' },
  { name: 'Lichess', url: (u) => `https://lichess.org/@/${u}`, category: 'gaming' },
  { name: 'Speedrun.com', url: (u) => `https://www.speedrun.com/user/${u}`, category: 'gaming' },
  { name: 'osu!', url: (u) => `https://osu.ppy.sh/users/${u}`, category: 'gaming' },
  { name: 'Newgrounds', url: (u) => `https://${u}.newgrounds.com`, category: 'gaming' },
  { name: 'GOG', url: (u) => `https://www.gog.com/u/${u}`, category: 'gaming' },
  { name: 'Kick', url: (u) => `https://kick.com/${u}`, category: 'gaming' },
  { name: 'YouTube', url: (u) => `https://www.youtube.com/@${u}`, category: 'gaming' },
  { name: 'Vimeo', url: (u) => `https://vimeo.com/${u}`, category: 'gaming' },
  { name: 'Dailymotion', url: (u) => `https://www.dailymotion.com/${u}`, category: 'gaming', soft: true },
  { name: 'Rumble', url: (u) => `https://rumble.com/user/${u}`, category: 'gaming' },

  // ── Music & audio ──
  { name: 'SoundCloud', url: (u) => `https://soundcloud.com/${u}`, category: 'music' },
  { name: 'Spotify', url: (u) => `https://open.spotify.com/user/${u}`, category: 'music', soft: true },
  { name: 'Bandcamp', url: (u) => `https://${u}.bandcamp.com`, category: 'music' },
  { name: 'Mixcloud', url: (u) => `https://www.mixcloud.com/${u}/`, category: 'music', absent: 'This is Audio Culture' },
  { name: 'Last.fm', url: (u) => `https://www.last.fm/user/${u}`, category: 'music' },
  { name: 'Genius', url: (u) => `https://genius.com/${u}`, category: 'music' },
  { name: 'Bandlab', url: (u) => `https://www.bandlab.com/${u}`, category: 'music', soft: true },
  { name: 'Audiomack', url: (u) => `https://audiomack.com/${u}`, category: 'music', absent: 'Music platform empowering' },
  { name: 'ReverbNation', url: (u) => `https://www.reverbnation.com/${u}`, category: 'music' },

  // ── Art, design & photography ──
  { name: 'Behance', url: (u) => `https://www.behance.net/${u}`, category: 'creative' },
  { name: 'Dribbble', url: (u) => `https://dribbble.com/${u}`, category: 'creative' },
  { name: 'DeviantArt', url: (u) => `https://www.deviantart.com/${u}`, category: 'creative' },
  { name: 'ArtStation', url: (u) => `https://www.artstation.com/${u}`, category: 'creative' },
  { name: '500px', url: (u) => `https://500px.com/p/${u}`, category: 'creative', soft: true },
  { name: 'Flickr', url: (u) => `https://www.flickr.com/people/${u}`, category: 'creative' },
  { name: 'Unsplash', url: (u) => `https://unsplash.com/@${u}`, category: 'creative' },
  { name: 'Imgur', url: (u) => `https://imgur.com/user/${u}`, category: 'creative', soft: true },
  { name: 'Giphy', url: (u) => `https://giphy.com/${u}`, category: 'creative' },
  { name: 'VSCO', url: (u) => `https://vsco.co/${u}/gallery`, category: 'creative' },
  { name: 'Pixiv', url: (u) => `https://www.pixiv.net/en/users/${u}`, category: 'creative' },
  { name: 'Redbubble', url: (u) => `https://www.redbubble.com/people/${u}/shop`, category: 'creative' },

  // ── Writing, blogging & reading ──
  { name: 'Medium', url: (u) => `https://medium.com/@${u}`, category: 'blog' },
  { name: 'Substack', url: (u) => `https://${u}.substack.com`, category: 'blog' },
  { name: 'WordPress', url: (u) => `https://profiles.wordpress.org/${u}/`, category: 'blog' },
  { name: 'Blogger', url: (u) => `https://${u}.blogspot.com`, category: 'blog' },
  { name: 'Wattpad', url: (u) => `https://www.wattpad.com/user/${u}`, category: 'blog' },
  { name: 'Goodreads', url: (u) => `https://www.goodreads.com/${u}`, category: 'blog' },
  { name: 'Letterboxd', url: (u) => `https://letterboxd.com/${u}/`, category: 'blog' },
  { name: 'Trakt', url: (u) => `https://trakt.tv/users/${u}`, category: 'blog' },
  { name: 'Myspace', url: (u) => `https://myspace.com/${u}`, category: 'blog' },
  { name: 'Slideshare', url: (u) => `https://www.slideshare.net/${u}`, category: 'blog', absent: 'no longer exists' },
  { name: 'Scribd', url: (u) => `https://www.scribd.com/${u}`, category: 'blog' },
  { name: 'Issuu', url: (u) => `https://issuu.com/${u}`, category: 'blog' },
  { name: 'Quora', url: (u) => `https://www.quora.com/profile/${u}`, category: 'blog' },

  // ── Commerce, freelance & creator economy ──
  { name: 'Patreon', url: (u) => `https://www.patreon.com/${u}`, category: 'commerce' },
  { name: 'Ko-fi', url: (u) => `https://ko-fi.com/${u}`, category: 'commerce' },
  { name: 'Buy Me a Coffee', url: (u) => `https://www.buymeacoffee.com/${u}`, category: 'commerce' },
  { name: 'Gumroad', url: (u) => `https://${u}.gumroad.com`, category: 'commerce' },
  { name: 'Product Hunt', url: (u) => `https://www.producthunt.com/@${u}`, category: 'commerce' },
  { name: 'Fiverr', url: (u) => `https://www.fiverr.com/${u}`, category: 'commerce' },
  { name: 'Freelancer', url: (u) => `https://www.freelancer.com/u/${u}`, category: 'commerce' },
  { name: 'Etsy', url: (u) => `https://www.etsy.com/shop/${u}`, category: 'commerce' },
  { name: 'eBay', url: (u) => `https://www.ebay.com/usr/${u}`, category: 'commerce', soft: true },
  { name: 'Cash App', url: (u) => `https://cash.app/$${u}`, category: 'commerce' },
  { name: 'Venmo', url: (u) => `https://venmo.com/${u}`, category: 'commerce' },
  { name: 'Wellfound', url: (u) => `https://wellfound.com/u/${u}`, category: 'commerce' },

  // ── Misc & utility ──
  { name: 'Pastebin', url: (u) => `https://pastebin.com/u/${u}`, category: 'misc' },
  { name: 'Gravatar (hash)', url: (u) => `https://en.gravatar.com/${u}`, category: 'misc' },
  { name: 'Chess24', url: (u) => `https://chess24.com/en/read/players/${u}`, category: 'misc' },
  { name: 'Strava', url: (u) => `https://www.strava.com/athletes/${u}`, category: 'misc' },
  { name: 'Untappd', url: (u) => `https://untappd.com/user/${u}`, category: 'misc' },
  { name: 'AllTrails', url: (u) => `https://www.alltrails.com/members/${u}`, category: 'misc' },
  { name: 'Duolingo', url: (u) => `https://www.duolingo.com/profile/${u}`, category: 'misc', present: 'on Duolingo' },
  { name: 'Tinder', url: (u) => `https://tinder.com/@${u}`, category: 'misc', soft: true },
  { name: 'Telegram (channel)', url: (u) => `https://t.me/s/${u}`, category: 'misc', present: 'tgme_page_extra' },
];

// A recent desktop browser UA — many platforms serve a bot-wall or a
// different (login) page to unknown agents, which skews detection.
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

async function checkSite(site, username) {
  const url = site.url(username);
  try {
    const res = await httpRaw(url, {
      timeout: 9000,
      redirect: 'manual',
      headers: { Accept: 'text/html,application/json', 'User-Agent': UA },
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
    if (res.status === 200) {
      // Marker-based disambiguation for sites that answer 200 for everything:
      //   present → body MUST contain this for a hit
      //   absent  → body containing this means "not found"
      //   soft    → 200 alone is inconclusive; report as indeterminate
      if (site.present || site.absent || site.soft) {
        const body = await res.text();
        if (site.present) return result(site, url, body.includes(site.present), 200);
        if (site.absent) return result(site, url, !body.includes(site.absent), 200);
        return result(site, url, null, 200); // soft
      }
      return result(site, url, true, 200);
    }
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
  const workers = Array.from({ length: 16 }, async () => {
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
