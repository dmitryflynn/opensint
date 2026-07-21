import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env from the repo root (one level up) and from the server dir.
dotenv.config({ path: resolve(__dirname, '..', '.env') });
dotenv.config({ path: resolve(__dirname, '.env') });

export const config = {
  port: Number(process.env.PORT) || 4000,
  corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  keys: {
    hibp: process.env.HIBP_API_KEY || '',
    virustotal: process.env.VIRUSTOTAL_API_KEY || '',
    abuseipdb: process.env.ABUSEIPDB_API_KEY || '',
    shodan: process.env.SHODAN_API_KEY || '',
    ipinfo: process.env.IPINFO_TOKEN || '',
  },
};

/** Report which optional integrations are configured (never leaks key values). */
export function keyStatus() {
  return Object.fromEntries(
    Object.entries(config.keys).map(([k, v]) => [k, Boolean(v)])
  );
}
