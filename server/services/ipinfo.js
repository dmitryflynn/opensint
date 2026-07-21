import { httpJson } from './http.js';
import { config } from '../config.js';

// IP intelligence: geolocation + ASN + reputation + exposed services.
// Aggregates several providers; each is optional and failures are isolated
// so one dead upstream never kills the whole lookup.
export async function ipIntel(ip) {
  const [geo, reputation, ports] = await Promise.all([
    geolocate(ip),
    abuseReputation(ip),
    openPorts(ip),
  ]);
  return { ip, geo, reputation, ports };
}

async function geolocate(ip) {
  // Prefer IPinfo if a token is present, else fall back to free ip-api.com.
  if (config.keys.ipinfo) {
    try {
      const { ok, json } = await httpJson(
        `https://ipinfo.io/${encodeURIComponent(ip)}?token=${config.keys.ipinfo}`
      );
      if (ok && json) {
        const [lat, lon] = String(json.loc || '').split(',');
        return {
          source: 'ipinfo.io',
          city: json.city,
          region: json.region,
          country: json.country,
          org: json.org,
          asn: (json.org || '').split(' ')[0]?.startsWith('AS') ? json.org.split(' ')[0] : undefined,
          hostname: json.hostname,
          lat: lat ? Number(lat) : undefined,
          lon: lon ? Number(lon) : undefined,
        };
      }
    } catch {
      /* fall through to free provider */
    }
  }
  try {
    const { ok, json } = await httpJson(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,message,country,regionName,city,lat,lon,isp,org,as,asname,reverse,mobile,proxy,hosting,query`
    );
    if (ok && json && json.status === 'success') {
      return {
        source: 'ip-api.com',
        city: json.city,
        region: json.regionName,
        country: json.country,
        isp: json.isp,
        org: json.org,
        asn: json.as,
        asnName: json.asname,
        hostname: json.reverse,
        lat: json.lat,
        lon: json.lon,
        flags: { mobile: json.mobile, proxy: json.proxy, hosting: json.hosting },
      };
    }
    return { source: 'ip-api.com', error: json?.message || 'lookup failed' };
  } catch (err) {
    return { error: err.message };
  }
}

async function abuseReputation(ip) {
  if (!config.keys.abuseipdb) return { source: 'abuseipdb', configured: false };
  try {
    const { ok, json } = await httpJson(
      `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`,
      { headers: { Key: config.keys.abuseipdb, Accept: 'application/json' } }
    );
    if (ok && json?.data) {
      const d = json.data;
      return {
        source: 'abuseipdb',
        configured: true,
        abuseConfidenceScore: d.abuseConfidenceScore,
        totalReports: d.totalReports,
        lastReportedAt: d.lastReportedAt,
        isTor: d.isTor,
        usageType: d.usageType,
        domain: d.domain,
      };
    }
    return { source: 'abuseipdb', configured: true, error: 'lookup failed' };
  } catch (err) {
    return { source: 'abuseipdb', configured: true, error: err.message };
  }
}

async function openPorts(ip) {
  if (!config.keys.shodan) return { source: 'shodan', configured: false };
  try {
    const { ok, json, status } = await httpJson(
      `https://api.shodan.io/shodan/host/${encodeURIComponent(ip)}?key=${config.keys.shodan}`
    );
    if (ok && json) {
      return {
        source: 'shodan',
        configured: true,
        ports: json.ports || [],
        hostnames: json.hostnames || [],
        tags: json.tags || [],
        vulns: json.vulns || [],
        lastUpdate: json.last_update,
      };
    }
    if (status === 404) return { source: 'shodan', configured: true, ports: [], note: 'no data for this host' };
    return { source: 'shodan', configured: true, error: `status ${status}` };
  } catch (err) {
    return { source: 'shodan', configured: true, error: err.message };
  }
}
