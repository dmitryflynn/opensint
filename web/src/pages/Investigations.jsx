import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { Card, Spinner, ErrorBox, EmptyState, Badge } from '../components.jsx';
import { getPins, clearPins } from './PinButton.jsx';

export default function Investigations() {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [pins, setPinsState] = useState(getPins());
  const [name, setName] = useState('');
  const navigate = useNavigate();

  const load = () => api.investigations().then(setList).catch((e) => setError(e.message));
  useEffect(() => {
    load();
    const onPins = () => setPinsState(getPins());
    window.addEventListener('opensint-pins', onPins);
    return () => window.removeEventListener('opensint-pins', onPins);
  }, []);

  const createBoard = async () => {
    // Seed a board from the pinned entities, laid out on a circle.
    const nodes = pins.map((p, i) => {
      const angle = (i / Math.max(pins.length, 1)) * Math.PI * 2;
      return {
        id: p.id,
        type: p.type,
        label: p.label || p.value,
        value: p.value,
        x: 400 + Math.cos(angle) * 200,
        y: 280 + Math.sin(angle) * 180,
      };
    });
    const inv = await api.saveInvestigation({ name: name || 'New investigation', nodes, edges: [] });
    clearPins();
    navigate(`/investigations/${inv.id}`);
  };

  const remove = async (id) => {
    await api.deleteInvestigation(id);
    load();
  };

  return (
    <div>
      <div className="page-head">
        <h1>Investigations</h1>
        <p>Collect entities from any module, then map how they connect. Boards are stored server-side so your team can share them.</p>
      </div>

      <Card title="Investigation clipboard" right={<Badge tone="a">{pins.length} pinned</Badge>}>
        {pins.length ? (
          <>
            <div className="tags mb">
              {pins.map((p) => (
                <span className="tag" key={p.id}>
                  <span className="muted">{p.type}:</span> {p.label || p.value}
                </span>
              ))}
            </div>
            <div className="input-row">
              <div className="field">
                <label>New board name</label>
                <input className="input" value={name} placeholder="e.g. Acme Corp footprint" onChange={(e) => setName(e.target.value)} />
              </div>
              <button className="btn btn-primary" onClick={createBoard}>🕸 Create board</button>
              <button className="btn btn-ghost" onClick={() => { clearPins(); setPinsState([]); }}>Clear</button>
            </div>
          </>
        ) : (
          <div className="muted small">Nothing pinned yet. Use the 📍 Pin button on any result to collect entities here.</div>
        )}
      </Card>

      <Card title="Saved boards">
        {error && <ErrorBox>{error}</ErrorBox>}
        {!list && !error && <Spinner />}
        {list && list.length === 0 && <EmptyState icon="🕸" title="No investigations yet" >Pin some entities and create your first board.</EmptyState>}
        {list && list.length > 0 && (
          <div className="list">
            {list.map((inv) => (
              <div className="list-row" key={inv.id}>
                <div className="meta" onClick={() => navigate(`/investigations/${inv.id}`)} style={{ cursor: 'pointer' }}>
                  <span style={{ fontSize: 18 }}>🕸</span>
                  <div>
                    <div className="title">{inv.name}</div>
                    <div className="sub">{inv.nodeCount} entities · updated {new Date(inv.updatedAt).toLocaleString()}</div>
                  </div>
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <button className="btn btn-sm" onClick={() => navigate(`/investigations/${inv.id}`)}>Open</button>
                  <button className="btn btn-sm btn-danger" onClick={() => remove(inv.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
