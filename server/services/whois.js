import net from 'node:net';

// A dependency-free WHOIS client. We first query IANA to find the
// authoritative WHOIS server for the TLD, then query that server and
// parse a handful of the most useful fields.

function queryServer(host, query, timeout = 8000) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(43, host);
    let data = '';
    socket.setTimeout(timeout);
    socket.on('connect', () => socket.write(query + '\r\n'));
    socket.on('data', (chunk) => (data += chunk.toString('utf8')));
    socket.on('end', () => resolve(data));
    socket.on('timeout', () => {
      socket.destroy();
      reject(new Error(`WHOIS timeout querying ${host}`));
    });
    socket.on('error', reject);
  });
}

export async function whoisLookup(domain) {
  // Find the referral WHOIS server from IANA.
  let referral = 'whois.iana.org';
  let raw = '';
  try {
    const ianaResp = await queryServer('whois.iana.org', domain);
    const m = ianaResp.match(/refer:\s*(\S+)/i);
    if (m) referral = m[1];
  } catch {
    /* fall back to a common registry server below */
  }

  try {
    raw = await queryServer(referral, domain);
    // Some registries return a thin record pointing at the registrar's WHOIS.
    const registrarServer = raw.match(/Registrar WHOIS Server:\s*(\S+)/i);
    if (registrarServer && registrarServer[1].toLowerCase() !== referral.toLowerCase()) {
      try {
        const deep = await queryServer(registrarServer[1], domain);
        if (deep && deep.length > raw.length / 2) raw = deep;
      } catch {
        /* keep the thin record */
      }
    }
  } catch (err) {
    return { server: referral, error: err.message, parsed: {}, raw: '' };
  }

  return { server: referral, parsed: parseWhois(raw), raw };
}

function parseWhois(raw) {
  const grab = (labels) => {
    for (const label of labels) {
      const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'im');
      const m = raw.match(re);
      if (m) return m[1].trim();
    }
    return undefined;
  };
  const grabAll = (label) => {
    const re = new RegExp(`^\\s*${label}\\s*:\\s*(.+)$`, 'gim');
    const out = [];
    let m;
    while ((m = re.exec(raw))) out.push(m[1].trim());
    return [...new Set(out)];
  };

  return clean({
    registrar: grab(['Registrar', 'Sponsoring Registrar']),
    createdDate: grab(['Creation Date', 'Created On', 'created', 'Registration Time']),
    updatedDate: grab(['Updated Date', 'Last Modified', 'changed']),
    expiryDate: grab(['Registry Expiry Date', 'Expiration Date', 'Expiry Date', 'paid-till']),
    registrant: grab(['Registrant Organization', 'Registrant Name', 'org']),
    registrantCountry: grab(['Registrant Country']),
    nameServers: grabAll('Name Server').map((s) => s.toLowerCase()),
    status: grabAll('Domain Status').map((s) => s.split(' ')[0]),
    dnssec: grab(['DNSSEC']),
  });
}

function clean(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}
