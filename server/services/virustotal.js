import { httpRaw } from './http.js';
import { config } from '../config.js';

// File & hash reputation via VirusTotal v3. Given a hash, we look up the
// existing report (detections across 70+ engines). Given an uploaded file,
// we submit it and return the analysis. Requires a free VT API key.
const VT = 'https://www.virustotal.com/api/v3';

function vtHeaders() {
  return { 'x-apikey': config.keys.virustotal };
}

export async function hashReport(hash) {
  if (!config.keys.virustotal) {
    return { source: 'virustotal', configured: false, note: 'Set VIRUSTOTAL_API_KEY to enable hash lookups.' };
  }
  try {
    const res = await httpRaw(`${VT}/files/${encodeURIComponent(hash)}`, { headers: vtHeaders() });
    if (res.status === 404) return { source: 'virustotal', configured: true, found: false };
    if (!res.ok) return { source: 'virustotal', configured: true, error: `status ${res.status}` };
    const { data } = await res.json();
    return { source: 'virustotal', configured: true, found: true, ...summarize(data) };
  } catch (err) {
    return { source: 'virustotal', configured: true, error: err.message };
  }
}

export async function scanFile(buffer, filename) {
  if (!config.keys.virustotal) {
    return { source: 'virustotal', configured: false, note: 'Set VIRUSTOTAL_API_KEY to enable file scanning.' };
  }
  try {
    const form = new FormData();
    form.append('file', new Blob([buffer]), filename || 'upload.bin');
    const res = await httpRaw(`${VT}/files`, { method: 'POST', headers: vtHeaders(), body: form, timeout: 60000 });
    if (!res.ok) return { source: 'virustotal', configured: true, error: `status ${res.status}` };
    const { data } = await res.json();
    // The submit endpoint returns an analysis id; poll once for a quick result.
    const analysisId = data?.id;
    return {
      source: 'virustotal',
      configured: true,
      submitted: true,
      analysisId,
      note: 'File queued for analysis. Re-query by its SHA-256 in a moment for full results.',
    };
  } catch (err) {
    return { source: 'virustotal', configured: true, error: err.message };
  }
}

function summarize(data) {
  const a = data?.attributes || {};
  const stats = a.last_analysis_stats || {};
  const engines = a.last_analysis_results || {};
  const detections = Object.entries(engines)
    .filter(([, r]) => r.category === 'malicious' || r.category === 'suspicious')
    .map(([engine, r]) => ({ engine, category: r.category, result: r.result }));
  return {
    meaningfulName: a.meaningful_name,
    type: a.type_description,
    size: a.size,
    md5: a.md5,
    sha1: a.sha1,
    sha256: a.sha256,
    stats,
    malicious: stats.malicious || 0,
    total: Object.values(stats).reduce((s, n) => s + (n || 0), 0),
    reputation: a.reputation,
    firstSeen: a.first_submission_date ? new Date(a.first_submission_date * 1000).toISOString() : undefined,
    detections: detections.slice(0, 40),
    tags: a.tags || [],
  };
}
