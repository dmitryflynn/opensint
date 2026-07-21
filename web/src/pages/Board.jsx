import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Spinner, ErrorBox, Badge } from '../components.jsx';

// Entity type → colour + glyph for the graph.
const TYPE_STYLE = {
  domain: { color: '#4aa3ff', glyph: '🌐' },
  ip: { color: '#38e0c8', glyph: '📡' },
  email: { color: '#a78bfa', glyph: '✉' },
  username: { color: '#ffb454', glyph: '👤' },
  hash: { color: '#ff5d6c', glyph: '🧬' },
  phone: { color: '#4ad991', glyph: '☎' },
  note: { color: '#8296ac', glyph: '📝' },
};

export default function Board() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv, setInv] = useState(null);
  const [error, setError] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);
  const [drag, setDrag] = useState(null);
  const svgRef = useRef();

  useEffect(() => {
    api.investigation(id).then(setInv).catch((e) => setError(e.message));
  }, [id]);

  const save = useCallback(async () => {
    const saved = await api.saveInvestigation(inv);
    setInv(saved);
    setDirty(false);
  }, [inv]);

  // Pointer-based node dragging in SVG coordinate space.
  const onPointerDown = (e, node) => {
    e.stopPropagation();
    if (linkFrom) {
      if (linkFrom !== node.id) {
        addEdge(linkFrom, node.id);
      }
      setLinkFrom(null);
      return;
    }
    const pt = toSvg(e);
    setDrag({ id: node.id, dx: node.x - pt.x, dy: node.y - pt.y });
  };

  const onPointerMove = (e) => {
    if (!drag) return;
    const pt = toSvg(e);
    setInv((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === drag.id ? { ...n, x: pt.x + drag.dx, y: pt.y + drag.dy } : n)),
    }));
    setDirty(true);
  };

  const toSvg = (e) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const vb = svg.viewBox.baseVal;
    return {
      x: ((e.clientX - rect.left) / rect.width) * vb.width,
      y: ((e.clientY - rect.top) / rect.height) * vb.height,
    };
  };

  const addEdge = (from, to) => {
    setInv((prev) => {
      if (prev.edges.some((ed) => (ed.from === from && ed.to === to) || (ed.from === to && ed.to === from))) return prev;
      return { ...prev, edges: [...prev.edges, { id: `${from}->${to}`, from, to, label: 'linked' }] };
    });
    setDirty(true);
  };

  const addNode = (type) => {
    const value = prompt(`Add ${type} — enter value:`);
    if (!value) return;
    const nid = `${type}:${value}`;
    setInv((prev) => ({
      ...prev,
      nodes: [...prev.nodes, { id: nid, type, value, label: value, x: 200 + Math.random() * 400, y: 150 + Math.random() * 300 }],
    }));
    setDirty(true);
  };

  const removeNode = (nid) => {
    setInv((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((n) => n.id !== nid),
      edges: prev.edges.filter((e) => e.from !== nid && e.to !== nid),
    }));
    setDirty(true);
  };

  const openInModule = (node) => {
    const routes = { domain: '/domain', ip: '/ip', email: '/email', username: '/username', hash: '/hash' };
    if (routes[node.type]) navigate(`${routes[node.type]}?q=${encodeURIComponent(node.value)}`);
  };

  if (error) return <ErrorBox>{error}</ErrorBox>;
  if (!inv) return <Spinner label="Loading board…" />;

  const nodeById = Object.fromEntries(inv.nodes.map((n) => [n.id, n]));

  return (
    <div onPointerMove={onPointerMove} onPointerUp={() => setDrag(null)}>
      <div className="row between mb">
        <div className="row" style={{ gap: 12 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/investigations')}>← Back</button>
          <input
            className="input"
            style={{ width: 320, fontWeight: 650 }}
            value={inv.name}
            onChange={(e) => { setInv({ ...inv, name: e.target.value }); setDirty(true); }}
          />
        </div>
        <div className="row" style={{ gap: 8 }}>
          {dirty && <Badge tone="w">Unsaved</Badge>}
          <button className="btn btn-primary btn-sm" onClick={save} disabled={!dirty}>💾 Save</button>
        </div>
      </div>

      <div className="graph-toolbar">
        <span className="small muted">Add:</span>
        {Object.keys(TYPE_STYLE).map((t) => (
          <button key={t} className="btn btn-sm btn-ghost" onClick={() => addNode(t)}>
            {TYPE_STYLE[t].glyph} {t}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        {linkFrom ? (
          <Badge tone="a">Click a target node to link… (Esc to cancel)</Badge>
        ) : (
          <span className="small muted">Tip: drag to move · click a node’s ⛓ to start a link</span>
        )}
      </div>

      <div className="graph-wrap">
        <svg ref={svgRef} viewBox="0 0 800 560" onClick={() => setLinkFrom(null)}>
          {/* edges */}
          {inv.edges.map((e) => {
            const a = nodeById[e.from];
            const b = nodeById[e.to];
            if (!a || !b) return null;
            return (
              <g key={e.id}>
                <line className="gedge" x1={a.x} y1={a.y} x2={b.x} y2={b.y} />
                <text className="gedge-label" x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 4} textAnchor="middle">{e.label}</text>
              </g>
            );
          })}
          {/* nodes */}
          {inv.nodes.map((n) => {
            const style = TYPE_STYLE[n.type] || TYPE_STYLE.note;
            return (
              <g key={n.id} className="gnode" transform={`translate(${n.x},${n.y})`}>
                <circle
                  r={22}
                  fill="#131a24"
                  stroke={style.color}
                  strokeWidth={linkFrom === n.id ? 3 : 2}
                  onPointerDown={(e) => onPointerDown(e, n)}
                />
                <text textAnchor="middle" dy="5" style={{ fontSize: 16 }}>{style.glyph}</text>
                <text textAnchor="middle" y={38} style={{ fill: style.color, fontWeight: 600 }}>{truncate(n.label, 18)}</text>
                {/* controls */}
                <g transform="translate(16,-16)" onClick={(e) => { e.stopPropagation(); setLinkFrom(n.id); }}>
                  <circle r={9} fill="#182130" stroke="#2c3e54" />
                  <text textAnchor="middle" dy="3.5" style={{ fontSize: 9 }}>⛓</text>
                </g>
                <g transform="translate(16,16)" onClick={(e) => { e.stopPropagation(); openInModule(n); }}>
                  <circle r={9} fill="#182130" stroke="#2c3e54" />
                  <text textAnchor="middle" dy="3.5" style={{ fontSize: 9 }}>↗</text>
                </g>
                <g transform="translate(-16,-16)" onClick={(e) => { e.stopPropagation(); removeNode(n.id); }}>
                  <circle r={9} fill="#182130" stroke="#3a2530" />
                  <text textAnchor="middle" dy="3.5" style={{ fontSize: 9, fill: '#ff5d6c' }}>×</text>
                </g>
              </g>
            );
          })}
          {inv.nodes.length === 0 && (
            <text x="400" y="280" textAnchor="middle" fill="#5a6b80">Empty board — add entities from the toolbar above.</text>
          )}
        </svg>
      </div>

      <div className="row mt" style={{ gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(TYPE_STYLE).map(([t, s]) => (
          <span key={t} className="integ"><span className="dot" style={{ background: s.color }} /> {s.glyph} {t}</span>
        ))}
      </div>
    </div>
  );
}

function truncate(s, n) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n - 1) + '…' : s;
}
