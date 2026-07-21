import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import crypto from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'data');
const FILE = resolve(DATA_DIR, 'investigations.json');

// A tiny flat-file persistence layer for investigation boards. No database
// required to self-host — everything lives in one JSON file.
async function readAll() {
  try {
    const raw = await fs.readFile(FILE, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeAll(map) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(map, null, 2), 'utf8');
}

export async function listInvestigations() {
  const all = await readAll();
  return Object.values(all)
    .map(({ id, name, updatedAt, nodes }) => ({
      id,
      name,
      updatedAt,
      nodeCount: (nodes || []).length,
    }))
    .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
}

export async function getInvestigation(id) {
  const all = await readAll();
  return all[id] || null;
}

export async function saveInvestigation(input) {
  const all = await readAll();
  const id = input.id && all[input.id] ? input.id : crypto.randomUUID();
  const now = new Date().toISOString();
  const existing = all[id];
  all[id] = {
    id,
    name: input.name || existing?.name || 'Untitled investigation',
    nodes: input.nodes || existing?.nodes || [],
    edges: input.edges || existing?.edges || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };
  await writeAll(all);
  return all[id];
}

export async function deleteInvestigation(id) {
  const all = await readAll();
  if (!all[id]) return false;
  delete all[id];
  await writeAll(all);
  return true;
}
