import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { config } from './config.js';
import { api } from './routes.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(
  cors({
    origin(origin, cb) {
      // Allow same-origin / tools with no origin, plus configured front ends.
      if (!origin || config.corsOrigin.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
  })
);

app.use(express.json({ limit: '2mb' }));
// Raw body for file uploads to the /file/scan endpoint.
app.use('/api/file/scan', express.raw({ type: '*/*', limit: '35mb' }));

app.use('/api', api);

// In production, serve the built front end so the whole app runs from one port.
const webDist = resolve(__dirname, '..', 'web', 'dist');
if (existsSync(webDist)) {
  app.use(express.static(webDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(resolve(webDist, 'index.html'));
  });
}

app.use((req, res) => res.status(404).json({ ok: false, error: 'Not found' }));

app.listen(config.port, () => {
  console.log(`\n  OpenSINT API listening on http://localhost:${config.port}`);
  console.log(`  Front end (dev): http://localhost:5173`);
  const enabled = Object.entries(
    Object.fromEntries(Object.entries(config.keys).map(([k, v]) => [k, Boolean(v)]))
  )
    .filter(([, v]) => v)
    .map(([k]) => k);
  console.log(`  Optional integrations enabled: ${enabled.length ? enabled.join(', ') : 'none (free sources only)'}\n`);
});
