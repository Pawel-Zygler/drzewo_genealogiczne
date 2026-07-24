import React, { useState, useMemo } from 'react';
import calcTree from 'relatives-tree';
import { nodes as allNodes, ExtNode } from '../data/familyTree';
import PersonNode from './PersonNode';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 160;
const CLUSTER_GAP = 250;

export default function RelativesTreeViewer() {
  const [rootId, setRootId] = useState<string>('all');
  const [zoom, setZoom] = useState<number>(0.9);

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
          clusters: [{ res, offsetX: 50, offsetY: 50 }],
          width: res.canvas.width * NODE_WIDTH + 400,
          height: res.canvas.height * NODE_HEIGHT + 400,
        };
      } catch (e) {
        console.error('Error calculating tree for root:', rootId, e);
      }
    }

    // Default 'all' mode: layout all 49 family members into clean clusters side-by-side
    const visited = new Set<string>();
    const clusters: { res: any; offsetX: number; offsetY: number }[] = [];
    
    const priorityRoots = ['pawel', 'gosia', 'aleksander_s', 'zofia_d', 'nn_d', 'franciszek', 'leon', 'michal_d'];
    const searchOrder = [
      ...priorityRoots.filter(id => nodeDataMap.has(id)),
      ...allNodes.map(n => n.id).filter(id => !priorityRoots.includes(id))
    ];

    let currentOffsetX = 50;
    let maxHeight = 0;

    searchOrder.forEach(id => {
      if (!visited.has(id)) {
        try {
          const res = calcTree(allNodes, { rootId: id });
          const newNodes = res.nodes.filter(rn => !visited.has(rn.id));

          if (newNodes.length > 0) {
            res.nodes.forEach(rn => visited.add(rn.id));

            clusters.push({
              res,
              offsetX: currentOffsetX,
              offsetY: 50,
            });

            const clusterW = Math.max(res.canvas.width * NODE_WIDTH, 200);
            const clusterH = Math.max(res.canvas.height * NODE_HEIGHT, 200);

            currentOffsetX += clusterW + CLUSTER_GAP;
            maxHeight = Math.max(maxHeight, clusterH);
          }
        } catch (e) {
          console.error('Error cluster:', id, e);
        }
      }
    });

    return {
      clusters,
      width: Math.max(currentOffsetX + 300, 1200),
      height: Math.max(maxHeight + 400, 800),
    };
  }, [rootId, nodeDataMap]);

  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc', overflow: 'auto', position: 'relative' }}>
      
      {/* Top Bar Controls */}
      <div style={{
        position: 'sticky',
        top: '15px',
        left: '15px',
        zIndex: 100,
        display: 'inline-flex',
        gap: '10px',
        background: 'white',
        padding: '10px 16px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        alignItems: 'center',
        fontFamily: 'Outfit',
        fontSize: '13px'
      }}>
        <span style={{ fontWeight: 600 }}>Centrum widoku:</span>
        <button 
          onClick={() => setRootId('all')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'all' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: rootId === 'all' ? '#eff6ff' : 'white', fontWeight: rootId === 'all' ? 600 : 400, cursor: 'pointer' }}
        >
          🌐 Wszystkie Rodziny (100% Osób)
        </button>
        <button 
          onClick={() => setRootId('pawel')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'pawel' ? '2px solid #dc2626' : '1px solid #cbd5e1', background: rootId === 'pawel' ? '#fee2e2' : 'white', fontWeight: rootId === 'pawel' ? 600 : 400, cursor: 'pointer' }}
        >
          ❤️ Paweł (Ty & Dzieci)
        </button>
        <button 
          onClick={() => setRootId('gosia')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'gosia' ? '2px solid #9333ea' : '1px solid #cbd5e1', background: rootId === 'gosia' ? '#faf5ff' : 'white', fontWeight: rootId === 'gosia' ? 600 : 400, cursor: 'pointer' }}
        >
          🟣 Gosia & Rodzina
        </button>
        <button 
          onClick={() => setRootId('franciszek')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'franciszek' ? '2px solid #ea580c' : '1px solid #cbd5e1', background: rootId === 'franciszek' ? '#ffedd5' : 'white', fontWeight: rootId === 'franciszek' ? 600 : 400, cursor: 'pointer' }}
        >
          🟠 Dziadek Franek
        </button>

        <div style={{ marginLeft: '15px', borderLeft: '1px solid #cbd5e1', paddingLeft: '15px', display: 'flex', gap: '5px' }}>
          <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} style={{ padding: '4px 10px', cursor: 'pointer' }}>-</button>
          <span style={{ padding: '4px 6px' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} style={{ padding: '4px 10px', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        width: `${treeData.width}px`,
        height: `${treeData.height}px`,
        position: 'relative'
      }}>
        {treeData.clusters.map((cluster, cIdx) => {
          const { res, offsetX, offsetY } = cluster;
          return (
            <div key={cIdx} style={{ position: 'absolute', left: `${offsetX}px`, top: `${offsetY}px` }}>
              {/* SVG Connectors */}
              <svg style={{ position: 'absolute', top: 0, left: 0, width: '2000px', height: '2000px', pointerEvents: 'none', zIndex: 1 }}>
                {res.connectors.map(([x1, y1, x2, y2]: any, idx: number) => {
                  const sx = x1 * NODE_WIDTH + NODE_WIDTH / 2;
                  const sy = y1 * NODE_HEIGHT + 40;
                  const ex = x2 * NODE_WIDTH + NODE_WIDTH / 2;
                  const ey = y2 * NODE_HEIGHT + 40;

                  if (sx === ex || sy === ey) {
                    return (
                      <line
                        key={idx}
                        x1={sx}
                        y1={sy}
                        x2={ex}
                        y2={ey}
                        stroke="#64748b"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    );
                  }

                  return (
                    <path
                      key={idx}
                      d={`M ${sx} ${sy} H ${ex} V ${ey}`}
                      stroke="#64748b"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  );
                })}
              </svg>

              {/* Nodes */}
              {res.nodes.map((node: any) => {
                const customData = nodeDataMap.get(node.id);
                if (!customData) return null;

                const isRoot = node.id === rootId;
                const left = node.left * NODE_WIDTH;
                const top = node.top * NODE_HEIGHT;

                return (
                  <div
                    key={node.id}
                    onClick={() => setRootId(node.id)}
                    style={{
                      position: 'absolute',
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${NODE_WIDTH}px`,
                      height: `${NODE_HEIGHT}px`,
                      zIndex: 2,
                      cursor: 'pointer',
                      transition: 'transform 0.15s ease',
                    }}
                    title="Kliknij, aby ustawić tę osobę jako centrum widoku"
                  >
                    <PersonNode data={{ ...customData, isRoot }} />
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
