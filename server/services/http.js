// Thin wrapper around fetch with a timeout and sane defaults, so a slow
// upstream OSINT provider can't hang a request forever.

export async function httpJson(url, opts = {}) {
  const { timeout = 12000, ...rest } = opts;
  const res = await httpRaw(url, { timeout, ...rest });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Non-JSON response (${res.status}) from ${hostOf(url)}`);
  }
  return { ok: res.ok, status: res.status, json };
}

export async function httpRaw(url, opts = {}) {
  const { timeout = 12000, ...rest } = opts;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, {
      ...rest,
      signal: controller.signal,
      headers: {
        'User-Agent': 'OpenSINT/1.0 (+https://github.com/opensint)',
        ...(rest.headers || {}),
      },
    });
  } finally {
    clearTimeout(t);
  }
}

function hostOf(url) {
  try {
    return new URL(url).host;
  } catch {
    return 'upstream';
  }
}
