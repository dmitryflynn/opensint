import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useLookup, LookupForm, Card, KV, Spinner, ErrorBox, EmptyState, Badge } from '../components.jsx';
import PinButton from './PinButton.jsx';

export default function HashPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const { status, data, error, run } = useLookup(api.hash);
  const fileInput = useRef();
  const [uploadMsg, setUploadMsg] = useState(null);

  useEffect(() => {
    if (q) run(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadMsg({ loading: true });
    try {
      const res = await api.scanFile(file);
      setUploadMsg({ result: res });
    } catch (err) {
      setUploadMsg({ error: err.message });
    }
  };

  const bad = (data?.malicious || 0) > 0;

  return (
    <div>
      <div className="page-head">
        <h1>File & Hash Analysis</h1>
        <p>Reputation across 70+ antivirus engines via VirusTotal. Look up a known MD5 / SHA-1 / SHA-256, or upload a file to submit it for scanning. Requires a VirusTotal API key.</p>
      </div>

      <div className="card">
        <LookupForm label="File hash (MD5 / SHA-1 / SHA-256)" placeholder="44d88612fea8a8f36de82e1278abb02f" initial={q} loading={status === 'loading'} onSubmit={(v) => setParams({ q: v })} buttonText="Look up" />
        <div className="row mt" style={{ gap: 10 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => fileInput.current?.click()}>⬆ Upload a file to scan</button>
          <input ref={fileInput} type="file" hidden onChange={onFile} />
          <span className="small muted">Max 35 MB · file is forwarded to VirusTotal.</span>
        </div>
        {uploadMsg?.loading && <div className="mt"><Spinner label="Uploading & submitting…" /></div>}
        {uploadMsg?.error && <div className="mt"><ErrorBox>{uploadMsg.error}</ErrorBox></div>}
        {uploadMsg?.result && (
          <div className="mt note-box">
            {uploadMsg.result.configured === false ? uploadMsg.result.note : uploadMsg.result.note || 'Submitted for analysis.'}
          </div>
        )}
      </div>

      {status === 'loading' && <Card title="Querying VirusTotal"><Spinner /></Card>}
      {status === 'error' && <ErrorBox>{error}</ErrorBox>}
      {status === 'idle' && <EmptyState icon="🧬" title="Enter a hash or upload a file to begin" />}

      {status === 'done' && data && (
        <>
          {data.configured === false ? (
            <div className="note-box">{data.note}</div>
          ) : data.found === false ? (
            <EmptyState icon="🔎" title="Not found" >This hash has no report on VirusTotal.</EmptyState>
          ) : data.error ? (
            <ErrorBox>{data.error}</ErrorBox>
          ) : (
            <>
              <div className="row between mb">
                <span className="mono muted">{data.sha256}</span>
                <PinButton entity={{ type: 'hash', value: data.sha256, label: (data.meaningfulName || data.sha256).slice(0, 24) }} />
              </div>

              <div className="stats mb">
                <div className={`stat ${bad ? 'danger' : 'good'}`}><div className="n">{data.malicious}/{data.total}</div><div className="l">Malicious detections</div></div>
                <div className="stat"><div className="n">{data.stats?.suspicious || 0}</div><div className="l">Suspicious</div></div>
                <div className="stat"><div className="n">{data.stats?.harmless || 0}</div><div className="l">Harmless</div></div>
                <div className="stat"><div className="n">{formatBytes(data.size)}</div><div className="l">File size</div></div>
              </div>

              <div className="grid grid-2">
                <Card title="File details">
                  <div className="mb">{bad ? <Badge tone="r">Malicious</Badge> : <Badge tone="g">Clean</Badge>}</div>
                  <KV data={{ meaningfulName: data.meaningfulName, type: data.type, md5: data.md5, sha1: data.sha1, sha256: data.sha256, firstSeen: data.firstSeen, reputation: data.reputation, tags: data.tags }} />
                </Card>
                <Card title="Engine detections" right={<Badge tone={bad ? 'r' : 'g'}>{data.detections?.length || 0}</Badge>}>
                  {data.detections?.length ? (
                    <div className="scrollbox"><div className="list" style={{ padding: 10 }}>
                      {data.detections.map((d) => (
                        <div className="list-row" key={d.engine}>
                          <span className="title">{d.engine}</span>
                          <span className="small" style={{ color: 'var(--danger)' }}>{d.result}</span>
                        </div>
                      ))}
                    </div></div>
                  ) : (
                    <div className="muted small">No engine flagged this file.</div>
                  )}
                </Card>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function formatBytes(n) {
  if (!n) return '—';
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(i ? 1 : 0)} ${u[i]}`;
}
