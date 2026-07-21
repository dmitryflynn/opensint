import { Resolver } from 'node:dns/promises';

// Resolve the common record types for a domain. Uses public resolvers so
// results don't depend on the host machine's DNS configuration.
const RECORD_TYPES = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'CNAME', 'SOA', 'CAA'];

export async function dnsRecords(domain) {
  const resolver = new Resolver({ timeout: 5000, tries: 2 });
  resolver.setServers(['1.1.1.1', '8.8.8.8']);

  const out = {};
  await Promise.all(
    RECORD_TYPES.map(async (type) => {
      try {
        const records = await resolver.resolve(domain, type);
        if (records && (Array.isArray(records) ? records.length : true)) {
          out[type] = normalize(type, records);
        }
      } catch {
        /* record type absent — omit it */
      }
    })
  );
  return out;
}

function normalize(type, records) {
  if (type === 'MX') {
    return records
      .sort((a, b) => a.priority - b.priority)
      .map((r) => `${r.priority} ${r.exchange}`);
  }
  if (type === 'TXT') return records.map((r) => (Array.isArray(r) ? r.join('') : r));
  if (type === 'SOA') return [`${records.nsname} ${records.hostmaster} serial=${records.serial}`];
  if (type === 'CAA') return records.map((r) => `${r.critical} ${r.issue || r.issuewild || ''}`.trim());
  return records;
}
