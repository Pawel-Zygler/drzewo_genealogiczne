import { useMemo, useState } from 'react';
import type { TreeStore } from '../data/store';
import { lifeSpan, useTree } from '../data/useTree';
import { founders, layoutDescendants, D } from '../data/descendants';
import { avatarUrl } from './PersonNode';
import PersonPanel from './PersonPanel';
import ZoomCanvas from './ZoomCanvas';
import StoreBadge from './StoreBadge';

const HEART = 'M0 4 C-2 -1 -9 -1 -9 4.5 C-9 9 -3 12 0 15 C3 12 9 9 9 4.5 C9 -1 2 -1 0 4 Z';

/** Version 2: descendant chart on a chalkboard, couples joined by a heart. */
export default function ChalkboardTree({ store }: { store: TreeStore }) {
  const { nodes, byId, photos, error, setError } = useTree(store);
  // On a phone all families side by side are too small to read, so start with the biggest one.
  const [rootId, setRootId] = useState(() => (window.innerWidth < 640 ? 'auto' : 'all'));
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);

  const familyList = useMemo(() => (nodes ? founders(nodes) : []), [nodes]);
  const activeRoot =
    rootId === 'all' || byId.has(rootId) ? rootId : rootId === 'auto' && familyList.length ? familyList[0].id : 'all';
  const layout = useMemo(() => layoutDescendants(nodes || [], activeRoot), [nodes, activeRoot]);

  const options = [
    { id: 'all', label: 'Wszystkie rody' },
    ...familyList.map(f => ({ id: f.id, label: f.label })),
  ];
  if (activeRoot !== 'all' && !options.some(o => o.id === activeRoot)) {
    options.push({ id: activeRoot, label: `Potomkowie: ${byId.get(activeRoot)!.label}` });
  }

  const toolbar = (
    <>
      <label className="alt-field">
        <span>Ród:</span>
        <select value={activeRoot} onChange={e => setRootId(e.target.value)}>
          {options.map(o => (
            <option key={o.id} value={o.id}>{o.label}</option>
          ))}
        </select>
      </label>
      {!store.readOnly && <button className="alt-add" onClick={() => setSelectedId(null)}>+ Dodaj osobę</button>}
      <StoreBadge store={store} />
    </>
  );

  const overlay = (
    <>
      {nodes === null && !error && <div className="tree-loading">Wczytywanie drzewa…</div>}
      {error && <div className="tree-toast" role="alert" onClick={() => setError(null)}>{error}</div>}
      {selectedId !== undefined && nodes && (
          <PersonPanel
            personId={selectedId}
            nodes={nodes}
            photos={photos}
            store={store}
            onSelect={id => setSelectedId(id === null ? undefined : id)}
            onFocus={id => setRootId(id)}
            onError={setError}
          />
      )}
    </>
  );

  const A = D.AVATAR;
  return (
    <ZoomCanvas width={layout.width} height={layout.height} fitKey={`${activeRoot}-${nodes ? 1 : 0}`} focusX={layout.nodes[0]?.x} minFitPhone={0.62} className="chalk" toolbar={toolbar} overlay={overlay}>
      <svg width={layout.width} height={layout.height} className="chalk-lines">
        {/* Plain strokes: an SVG filter over the whole (very large) drawing made phones, Safari especially, slow or drop the lines. */}
        <g fill="none" stroke="rgba(244,241,232,0.8)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          {layout.lines.map((d, i) => <path key={i} d={d} />)}
        </g>
        {layout.hearts.map((h, i) => (
          <path key={i} d={HEART} transform={`translate(${h.x} ${h.y - 7})`} fill="#f4a6c6" />
        ))}
        {layout.titles.map((t, i) => (
          <g key={i}>
            <text x={t.x} y={t.y} textAnchor="middle" className="chalk-title">{t.text}</text>
            <path d={`M ${t.x - 60} ${t.y + 10} q 30 6 60 0 t 60 0`} fill="none" stroke="#f6d365" strokeWidth="2" strokeLinecap="round" opacity="0.8" />
          </g>
        ))}
      </svg>

      {layout.nodes.map(n => {
        const p = byId.get(n.id);
        if (!p) return null;
        const span = lifeSpan(p);
        const selected = selectedId === n.id;
        return (
          <button
            key={`${n.id}-${n.x}-${n.y}`}
            className={`chalk-node${n.blood ? '' : ' partner'}${p.deceased ? ' deceased' : ''}${selected ? ' selected' : ''}`}
            style={{ left: n.x - D.NODE_W / 2, top: n.y, width: D.NODE_W }}
            onClick={() => setSelectedId(n.id)}
            title="Kliknij, aby zobaczyć, edytować lub dodać krewnych"
          >
            <span className="chalk-avatar" style={{ width: A, height: A }}>
              <img src={photos[p.id] || avatarUrl(p)} alt="" />
            </span>
            <strong>{p.label}</strong>
            {span && <small>{span}</small>}
            {p.role && <small className="role">{p.role}</small>}
          </button>
        );
      })}

    </ZoomCanvas>
  );
}
