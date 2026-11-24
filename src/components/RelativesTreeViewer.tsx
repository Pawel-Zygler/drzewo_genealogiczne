import React, { useState, useMemo, useRef, useLayoutEffect, useCallback } from 'react';
import calcTree from 'relatives-tree';
import { nodes as allNodes, ExtNode } from '../data/familyTree';
import PersonNode from './PersonNode';

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

export default function RelativesTreeViewer() {
  const [rootId, setRootId] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(0.9);
  const scrollRef = useRef<HTMLDivElement>(null);

  const nodeDataMap = useMemo(() => {
    const map = new Map<string, ExtNode>();
    allNodes.forEach(n => map.set(n.id, n));
    return map;
  }, []);

  const treeData = useMemo(() => {
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

    // Default 'all' mode: show every family member using as few trees as possible.
    // Each person-centred tree is computed once, then trees are picked greedily by how
    // many not-yet-shown people they add. This keeps e.g. Paweł's small family from
    // being drawn on its own and then again inside the Siudziński tree.
    const candidates: { id: string; res: any }[] = [];
    allNodes.forEach(n => {
      try {
        candidates.push({ id: n.id, res: calcTree(allNodes, { rootId: n.id }) });
      } catch (e) {
        console.error('Error cluster:', n.id, e);
      }
    });

    const visited = new Set<string>();
    const picked: any[] = [];
    while (visited.size < allNodes.length) {
      let best: { res: any; gain: number } | null = null;
      for (const c of candidates) {
        const gain = c.res.nodes.filter((rn: any) => !visited.has(rn.id)).length;
        if (gain > 0 && (!best || gain > best.gain)) best = { res: c.res, gain };
      }
      if (!best) break;
      best.res.nodes.forEach((rn: any) => visited.add(rn.id));
      picked.push(best.res);
    }

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
  }, [rootId]);

  // Scale the tree so its full width fits the visible area (never enlarging past 100%).
  const fitToScreen = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const available = el.clientWidth - 16;
    const fit = Math.min(1, available / treeData.width);
    setZoom(Math.max(MIN_ZOOM, Math.round(fit * 100) / 100));
    el.scrollTo({ left: 0, top: 0 });
  }, [treeData.width]);

  // Re-fit whenever the selected view changes, and when the window is resized.
  useLayoutEffect(() => {
    fitToScreen();
    window.addEventListener('resize', fitToScreen);
    return () => window.removeEventListener('resize', fitToScreen);
  }, [fitToScreen]);

  const views: { id: string; label: string; color: string; bg: string }[] = [
    { id: 'all', label: '🌐 Wszystkie Rodziny', color: '#2563eb', bg: '#eff6ff' },
    { id: 'pawel', label: '❤️ Paweł (Ty & Dzieci)', color: '#dc2626', bg: '#fee2e2' },
    { id: 'gosia', label: '🟣 Gosia & Rodzina', color: '#9333ea', bg: '#faf5ff' },
    { id: 'franciszek', label: '🟠 Dziadek Franek', color: '#ea580c', bg: '#ffedd5' },
  ];

  const zoomBtn: React.CSSProperties = {
    padding: '4px 10px',
    cursor: 'pointer',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    background: 'white',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>

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
          const active = rootId === v.id;
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

                    const isRoot = node.id === rootId;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setRootId(node.id)}
                        style={{
                          position: 'absolute',
                          left: `${node.left * HALF_W}px`,
                          top: `${node.top * HALF_H}px`,
                          width: `${NODE_WIDTH}px`,
                          height: `${NODE_HEIGHT}px`,
                          zIndex: 2,
                          cursor: 'pointer',
                        }}
                        title="Kliknij, aby ustawić tę osobę jako centrum widoku"
                      >
                        <PersonNode data={{ ...customData, isRoot }} height={NODE_HEIGHT} />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
