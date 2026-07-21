import React, { useState } from 'react';

// Pinning stashes an entity in localStorage. The Investigations page reads
// this "clipboard" to seed a new board, so findings from any module can be
// collected and then linked together into a graph.
const KEY = 'opensint.pins';

export function getPins() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}
export function setPins(pins) {
  localStorage.setItem(KEY, JSON.stringify(pins));
  window.dispatchEvent(new Event('opensint-pins'));
}
export function clearPins() {
  setPins([]);
}

export default function PinButton({ entity, small }) {
  const [pinned, setPinned] = useState(() => getPins().some((p) => p.type === entity.type && p.value === entity.value));

  const toggle = () => {
    const pins = getPins();
    const exists = pins.some((p) => p.type === entity.type && p.value === entity.value);
    if (exists) {
      setPins(pins.filter((p) => !(p.type === entity.type && p.value === entity.value)));
      setPinned(false);
    } else {
      setPins([...pins, { ...entity, id: `${entity.type}:${entity.value}` }]);
      setPinned(true);
    }
  };

  return (
    <button className={`btn ${small ? 'btn-sm' : ''} ${pinned ? '' : 'btn-ghost'}`} onClick={toggle} title="Pin to investigation clipboard">
      {pinned ? '📌 Pinned' : '📍 Pin'}
    </button>
  );
}
