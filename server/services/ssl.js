import tls from 'node:tls';

// Open a TLS connection to :443 and read the presented certificate chain.
// Gives us issuer, validity window, SANs and fingerprint without any
// third-party service.
export function sslCertificate(host, port = 443, timeout = 8000) {
  return new Promise((resolve) => {
    const socket = tls.connect(
      { host, port, servername: host, rejectUnauthorized: false, timeout },
      () => {
        const cert = socket.getPeerCertificate(true);
        const cipher = socket.getCipher();
        const protocol = socket.getProtocol();
        socket.end();
        if (!cert || Object.keys(cert).length === 0) {
          return resolve({ error: 'No certificate presented' });
        }
        const now = Date.now();
        const validTo = new Date(cert.valid_to).getTime();
        resolve({
          subject: cert.subject,
          issuer: cert.issuer,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysUntilExpiry: Math.round((validTo - now) / 86400000),
          expired: validTo < now,
          serialNumber: cert.serialNumber,
          fingerprint256: cert.fingerprint256,
          subjectAltNames: (cert.subjectaltname || '')
            .split(',')
            .map((s) => s.trim().replace(/^DNS:/, ''))
            .filter(Boolean),
          protocol,
          cipher: cipher ? `${cipher.name} (${cipher.version})` : undefined,
        });
      }
    );
    socket.on('timeout', () => {
      socket.destroy();
      resolve({ error: `TLS timeout connecting to ${host}:${port}` });
    });
    socket.on('error', (err) => resolve({ error: err.message }));
  });
}
