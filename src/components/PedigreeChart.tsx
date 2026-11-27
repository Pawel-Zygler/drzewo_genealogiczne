import { useEffect, useMemo, useState } from 'react';
import type { TreeStore } from '../data/store';
import type { Person } from '../data/treeOps';
import { useTree } from '../data/useTree';
import { ancestorDepth, defaultPedigreeRoot, pedigreeRows, pedigreeSlots } from '../data/pedigree';
import { avatarUrl } from './PersonNode';
import PersonPanel from './PersonPanel';
import ZoomCanvas from './ZoomCanvas';
import StoreBadge from './StoreBadge';

const BOX_W = 236;
const BOX_H = 98;
const COL_GAP = 44;
const SLOT_GAP = 14;
const PAD = 32;
const TOP = 92;
const ROOT_EXTRA = 120; // room under the root box for partner and children

const GEN_NAMES = ['', 'Rodzice', 'Dziadkowie', 'Pradziadkowie', 'Prapradziadkowie', 'Praprapradziadkowie'];

const isPhone = () => typeof window !== 'undefined' && window.innerWidth < 640;

/** Version 3: pedigree chart, the person on the left and ancestors branching to the right. */
export default function PedigreeChart({ store }: { store: TreeStore }) {
  const { nodes, byId, photos, error, setError } = useTree(store);
  const [rootId, setRootId] = useState<string | null>(null);
  const [gens, setGens] = useState<number | null>(null);
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);

  const activeRoot = rootId && byId.has(rootId) ? rootId : nodes ? defaultPedigreeRoot(nodes) : null;
  const depth = useMemo(() => (nodes && activeRoot ? ancestorDepth(nodes, activeRoot) : 1), [nodes, activeRoot]);
  const autoGens = Math.min(Math.max(depth, 3), isPhone() ? 3 : 5);
  const G = gens ?? autoGens;

  // A newly chosen person gets the automatic number of generations again.
  useEffect(() => setGens(null), [rootId]);

  const slots = useMemo(() => (nodes && activeRoot ? pedigreeSlots(nodes, activeRoot, G) : []), [nodes, activeRoot, G]);

  const { rows, count } = useMemo(() => pedigreeRows(slots, G), [slots, G]);
  const slotH = BOX_H + SLOT_GAP;
  const width = PAD * 2 + G * BOX_W + (G - 1) * COL_GAP;
  const height = TOP + Math.max(count * slotH, ((rows.get(1) ?? 0) + 0.5) * slotH + BOX_H / 2 + ROOT_EXTRA) + PAD;

  const pos = (n: number) => {
    const g = Math.floor(Math.log2(n));
    const cy = TOP + ((rows.get(n) ?? 0) + 0.5) * slotH;
    return { g, x: PAD + g * (BOX_W + COL_GAP), y: cy - BOX_H / 2, cy };
  };

  const root = activeRoot ? byId.get(activeRoot) : undefined;
  const people = useMemo(() => [...(nodes || [])].sort((a, b) => a.label.localeCompare(b.label, 'pl')), [nodes]);

  const toolbar = (
    <>
      <label className="alt-field">
        <span>Osoba:</span>
        <select value={activeRoot || ''} onChange={e => setRootId(e.target.value)}>
          {people.map(p => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
        </select>
      </label>
      <span className="alt-field">
        <span>Pokolenia:</span>
        <span className="alt-seg">
          {[3, 4, 5, 6].map(n => (
            <button key={n} className={n === G ? 'on' : ''} onClick={() => setGens(n)}>{n}</button>
          ))}
        </span>
      </span>
      {!store.readOnly && <button className="alt-add" onClick={() => setSelectedId(null)}>+ Dodaj osobę</button>}
      <StoreBadge store={store} />
    </>
  );

  // Connectors: from each known person's box to the boxes of their two parents.
  const lines: string[] = [];
  for (let n = 1; n < 2 ** (G - 1); n++) {
    if (!slots[n]) continue;
    const c = pos(n);
    const f = pos(2 * n);
    const m = pos(2 * n + 1);
    const midX = c.x + BOX_W + COL_GAP / 2;
    lines.push(`M ${c.x + BOX_W} ${c.cy} H ${midX} M ${midX} ${f.cy} V ${m.cy} M ${midX} ${f.cy} H ${f.x} M ${midX} ${m.cy} H ${m.x}`);
  }

  const renderBox = (n: number) => {
    const { x, y } = pos(n);
    const id = slots[n];
    const p = id ? byId.get(id) : undefined;
    if (!p) {
      const child = slots[n >> 1];
      if (!child) return null;
      const childPerson = byId.get(child)!;
      return (
        <button
          key={n}
          className="ped-box empty"
          style={{ left: x, top: y, width: BOX_W, height: BOX_H }}
          onClick={() => setSelectedId(child)}
          title={`Dodaj rodzica: ${childPerson.label}`}
        >
          <span className="ped-no">{n}</span>
          <span className="ped-empty-label">{n % 2 === 0 ? 'Ojciec' : 'Matka'} nieznan{n % 2 === 0 ? 'y' : 'a'}</span>
          {!store.readOnly && <span className="ped-empty-hint">+ dodaj</span>}
        </button>
      );
    }
    return (
      <button
        key={n}
        className={`ped-box ${p.gender === 'female' ? 'f' : p.gender === 'male' ? 'm' : ''}${p.deceased ? ' deceased' : ''}${selectedId === p.id ? ' selected' : ''}`}
        style={{ left: x, top: y, width: BOX_W, height: BOX_H }}
        onClick={() => setSelectedId(p.id)}
        title="Kliknij, aby zobaczyć, edytować lub dodać krewnych"
      >
        <span className="ped-no">{n}</span>
        <span className="ped-head">
          <img src={photos[p.id] || avatarUrl(p)} alt="" />
          <span>{p.label}{p.deceased && !p.label.includes('†') ? ' †' : ''}</span>
        </span>
        <span className="ped-body">
          <Row k="ur." v={p.born} />
          <Row k="zm." v={p.died} />
          {p.role && <span className="ped-note">{p.role}</span>}
        </span>
      </button>
    );
  };

  const rootInfo = root && (() => {
    const { x, y } = pos(1);
    return (
      <div className="ped-root-info" style={{ left: x, top: y + BOX_H + 12, width: BOX_W }}>
        <RelLine title="Małżonek / partner" people={root.spouses.map(r => byId.get(r.id)).filter(Boolean) as Person[]} onPick={setSelectedId} />
        <RelLine title="Dzieci" people={root.children.map(r => byId.get(r.id)).filter(Boolean) as Person[]} onPick={setRootId} hint="pokaż rodowód" />
      </div>
    );
  })();

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

  return (
    <ZoomCanvas width={width} height={height} fitKey={`${activeRoot}-${G}-${nodes ? 1 : 0}`} minFitPhone={0.42} className="pedigree" toolbar={toolbar} overlay={overlay}>
      <div className="ped-title" style={{ left: PAD, top: 14 }}>
        <h2>Rodowód{root ? <span> · {root.label}</span> : null}</h2>
      </div>
      {Array.from({ length: G }, (_, g) => (
        <div key={g} className="ped-gen" style={{ left: PAD + g * (BOX_W + COL_GAP), top: TOP - 30, width: BOX_W }}>
          {g === 0 ? 'Osoba' : GEN_NAMES[g] || `${g + 1}. pokolenie`}
        </div>
      ))}
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <path d={lines.join(' ')} fill="none" stroke="#8b7f6a" strokeWidth="1.6" />
      </svg>
      {[...rows.keys()].map(renderBox)}
      {rootInfo}
    </ZoomCanvas>
  );
}

function Row({ k, v }: { k: string; v?: string }) {
  return (
    <span className="ped-row">
      <span className="ped-k">{k}</span>
      <span className={v ? '' : 'ped-blank'}>{v || '—'}</span>
    </span>
  );
}

function RelLine({ title, people, onPick, hint }: { title: string; people: Person[]; onPick: (id: string) => void; hint?: string }) {
  return (
    <div className="ped-rel">
      <span className="ped-k">{title}</span>
      {people.length === 0 ? (
        <span className="ped-blank">—</span>
      ) : (
        people.map(p => (
          <button key={p.id} onClick={() => onPick(p.id)} title={hint}>{p.label}</button>
        ))
      )}
    </div>
  );
}
