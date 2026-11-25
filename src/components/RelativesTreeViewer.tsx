import React, { useState, useMemo, useRef, useLayoutEffect, useCallback, useEffect } from 'react';
import calcTree from 'relatives-tree';
import type { Person } from '../data/treeOps';
import type { Photos, TreeStore } from '../data/store';
import { layoutAll } from '../data/layout';
import PersonNode from './PersonNode';
import PersonPanel from './PersonPanel';

// relatives-tree works on a grid of half-node units: every node takes 2x2 cells
// and its connectors run through the centre of those cells. Positions and
// connector coordinates must therefore be multiplied by HALF the node size.
const NODE_WIDTH = 150;
const NODE_HEIGHT = 200;
const HALF_W = NODE_WIDTH / 2;
const HALF_H = NODE_HEIGHT / 2;
const CANVAS_PADDING = 40;
const CLUSTER_GAP_X = 120;
const CLUSTER_GAP_Y = 100;
const MAX_ROW_WIDTH = 2400;
const MIN_ZOOM = 0.2;
const MAX_ZOOM = 1.5;

export default function RelativesTreeViewer({ store }: { store: TreeStore }) {
  const [rootId, setRootId] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(0.9);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [allNodes, setAllNodes] = useState<Person[] | null>(null);
  const [photos, setPhotos] = useState<Photos>({});
  // undefined = panel closed, null = adding a new unconnected person
  const [selectedId, setSelectedId] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offNodes = store.subscribe(setAllNodes, e => {
      console.error(e);
      setError('Nie udało się połączyć z bazą danych drzewa.');
    });
    const offPhotos = store.subscribePhotos(setPhotos);
    return () => {
      offNodes();
      offPhotos();
    };
  }, [store]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  const nodeDataMap = useMemo(() => {
    const map = new Map<string, Person>();
    (allNodes || []).forEach(n => map.set(n.id, n));
    return map;
  }, [allNodes]);

  // The focused person may have been removed (possibly by another editor).
  const activeRoot = rootId === 'all' || nodeDataMap.has(rootId) ? rootId : 'all';

  const treeData = useMemo(() => {
    const rootId = activeRoot;
    if (!allNodes || allNodes.length === 0) return { clusters: [], width: 0, height: 0 };
    if (rootId !== 'all') {
      try {
        const res = calcTree(allNodes, { rootId });
        return {
          clusters: [{ res, offsetX: CANVAS_PADDING, offsetY: CANVAS_PADDING }],
          width: res.canvas.width * HALF_W + CANVAS_PADDING * 2,
          height: res.canvas.height * HALF_H + CANVAS_PADDING * 2,
        };
      } catch (e) {
        console.error('Error calculating tree for root:', rootId, e);
      }
    }

    // Default 'all' mode: one layout in which every person appears exactly once.
    // (Covering the family with person-centred relatives-tree layouts drew whole
    // branches twice, e.g. when an in-law's parent was added.)
    const picked: any[] = layoutAll(allNodes);

    const clusters: { res: any; offsetX: number; offsetY: number }[] = [];

    // Pack clusters left-to-right, wrapping into a new row when a row gets too wide,
    // so the overview doesn't turn into one extremely long horizontal strip.
    let cursorX = CANVAS_PADDING;
    let cursorY = CANVAS_PADDING;
    let rowHeight = 0;
    let maxWidth = 0;

    picked.forEach(res => {
      const clusterW = res.canvas.width * HALF_W;
      const clusterH = res.canvas.height * HALF_H;

      if (cursorX > CANVAS_PADDING && cursorX + clusterW > MAX_ROW_WIDTH) {
        cursorX = CANVAS_PADDING;
        cursorY += rowHeight + CLUSTER_GAP_Y;
        rowHeight = 0;
      }

      clusters.push({ res, offsetX: cursorX, offsetY: cursorY });

      cursorX += clusterW + CLUSTER_GAP_X;
      rowHeight = Math.max(rowHeight, clusterH);
      maxWidth = Math.max(maxWidth, cursorX - CLUSTER_GAP_X);
    });

    return {
      clusters,
      width: maxWidth + CANVAS_PADDING,
      height: cursorY + rowHeight + CANVAS_PADDING,
    };
  }, [activeRoot, allNodes]);

  // Scale the tree so its full width fits the visible area (never enlarging past 100%).
  const widthRef = useRef(0);
  widthRef.current = treeData.width;
  const fitToScreen = useCallback(() => {
    const el = scrollRef.current;
    if (!el || !widthRef.current) return;
    const available = el.clientWidth - 16;
    const fit = Math.min(1, available / widthRef.current);
    setZoom(Math.max(MIN_ZOOM, Math.round(fit * 100) / 100));
    el.scrollTo({ left: 0, top: 0 });
  }, []);

  // Re-fit when the selected view changes, once the data arrives and on resize,
  // but not after every edit, so the view doesn't jump while someone is editing.
  const loaded = allNodes !== null;
  useLayoutEffect(() => {
    fitToScreen();
  }, [fitToScreen, activeRoot, loaded]);
  useEffect(() => {
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  const views: { id: string; label: string; color: string; bg: string }[] = [
    { id: 'all', label: '🌐 Wszystkie Rodziny', color: '#2563eb', bg: '#eff6ff' },
    { id: 'pawel', label: '❤️ Paweł (Ty & Dzieci)', color: '#dc2626', bg: '#fee2e2' },
    { id: 'gosia', label: '🟣 Gosia & Rodzina', color: '#9333ea', bg: '#faf5ff' },
    { id: 'franciszek', label: '🟠 Dziadek Franek', color: '#ea580c', bg: '#ffedd5' },
  ].filter(v => v.id === 'all' || nodeDataMap.has(v.id));

  const zoomBtn: React.CSSProperties = {
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    background: 'white',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative' }}>

      {/* Toolbar: sits above the scroll area so it never covers the tree and wraps on narrow screens */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center',
        padding: '10px 16px',
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        fontFamily: 'Outfit, sans-serif',
        fontSize: '13px',
        zIndex: 5,
      }}>
        <span style={{ fontWeight: 600 }}>Centrum widoku:</span>
        {views.map(v => {
          const active = activeRoot === v.id;
          return (
            <button
              key={v.id}
              onClick={() => setRootId(v.id)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                border: active ? `2px solid ${v.color}` : '1px solid #cbd5e1',
                background: active ? v.bg : 'white',
                fontWeight: active ? 600 : 400,
                fontFamily: 'inherit',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
              }}
            >
              {v.label}
            </button>
          );
        })}

        <button
          onClick={() => setSelectedId(null)}
          style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #16a34a', background: '#f0fdf4', color: '#166534', fontWeight: 600, fontFamily: 'inherit', whiteSpace: 'nowrap', cursor: 'pointer' }}
        >
          + Dodaj osobę
        </button>
        <span
          className={`store-badge ${store.mode}`}
          title={store.mode === 'shared'
            ? 'Zmiany zapisują się we wspólnej bazie i od razu widzi je każdy, kto ma link.'
            : 'Brak konfiguracji bazy danych: zmiany zapisują się tylko w tej przeglądarce.'}
        >
          {store.mode === 'shared' ? '● Wspólne drzewo' : '● Tryb lokalny'}
        </span>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '5px', alignItems: 'center' }}>
          <button onClick={() => setZoom(z => Math.max(MIN_ZOOM, Math.round((z - 0.1) * 100) / 100))} style={zoomBtn} aria-label="Pomniejsz">−</button>
          <span style={{ minWidth: '42px', textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(MAX_ZOOM, Math.round((z + 0.1) * 100) / 100))} style={zoomBtn} aria-label="Powiększ">+</button>
          <button onClick={fitToScreen} style={zoomBtn}>Dopasuj</button>
        </div>
      </div>

      {/* Scrollable canvas */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflow: 'auto', position: 'relative' }}>
        {/* Sized to the zoomed tree so scrollbars match what is actually visible */}
        <div style={{ width: `${treeData.width * zoom}px`, height: `${treeData.height * zoom}px`, position: 'relative' }}>
          <div style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            width: `${treeData.width}px`,
            height: `${treeData.height}px`,
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            {treeData.clusters.map((cluster, cIdx) => {
              const { res, offsetX, offsetY } = cluster;
              const clusterW = res.canvas.width * HALF_W;
              const clusterH = res.canvas.height * HALF_H;
              return (
                <div key={cIdx} style={{ position: 'absolute', left: `${offsetX}px`, top: `${offsetY}px`, width: `${clusterW}px`, height: `${clusterH}px` }}>
                  {/* Connectors: relatives-tree gives them in the same half-unit grid as the nodes */}
                  <svg
                    width={clusterW}
                    height={clusterH}
                    style={{ position: 'absolute', top: 0, left: 0, overflow: 'visible', pointerEvents: 'none', zIndex: 1 }}
                  >
                    {res.connectors.map(([x1, y1, x2, y2]: number[], idx: number) => (
                      <line
                        key={idx}
                        x1={x1 * HALF_W}
                        y1={y1 * HALF_H}
                        x2={x2 * HALF_W}
                        y2={y2 * HALF_H}
                        stroke="#94a3b8"
                        strokeWidth="2"
                        strokeLinecap="square"
                      />
                    ))}
                  </svg>

                  {/* Nodes */}
                  {res.nodes.map((node: any) => {
                    const customData = nodeDataMap.get(node.id);
                    if (!customData) return null;

                    const isRoot = node.id === activeRoot;

                    return (
                      <div
                        key={node.id}
                        className="tree-node"
                        onClick={() => setSelectedId(node.id)}
                        style={{
                          position: 'absolute',
                          left: `${node.left * HALF_W}px`,
                          top: `${node.top * HALF_H}px`,
                          width: `${NODE_WIDTH}px`,
                          height: `${NODE_HEIGHT}px`,
                          zIndex: 2,
                          cursor: 'pointer',
                        }}
                        title="Kliknij, aby zobaczyć, edytować lub dodać krewnych"
                      >
                        <PersonNode data={{ ...customData, isRoot, isSelected: node.id === selectedId }} height={NODE_HEIGHT} photo={photos[node.id]} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {allNodes === null && !error && <div className="tree-loading">Wczytywanie drzewa…</div>}
      {error && <div className="tree-toast" role="alert" onClick={() => setError(null)}>{error}</div>}

      {selectedId !== undefined && allNodes && (
        <PersonPanel
          personId={selectedId}
          nodes={allNodes}
          photos={photos}
          store={store}
          onSelect={id => setSelectedId(id === null ? undefined : id)}
          onFocus={id => setRootId(id)}
          onError={setError}
        />
      )}
    </div>
  );
}
