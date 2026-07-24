import React, { useState, useMemo, useRef } from 'react';
import calcTree from 'relatives-tree';
import { nodes as allNodes, ExtNode } from '../data/familyTree';
import PersonNode from './PersonNode';

const NODE_WIDTH = 150;
const NODE_HEIGHT = 160;

export default function RelativesTreeViewer() {
  const [rootId, setRootId] = useState<string>('pawel');
  const [zoom, setZoom] = useState<number>(1);

  // Map to easily look up custom data (label, role, deceased, branch) by ID
  const nodeDataMap = useMemo(() => {
    const map = new Map<string, ExtNode>();
    allNodes.forEach(n => map.set(n.id, n));
    return map;
  }, []);

  // Compute tree layout using relatives-tree
  const data = useMemo(() => {
    try {
      return calcTree(allNodes, { rootId });
    } catch (e) {
      console.error('Error calculating tree:', e);
      return null;
    }
  }, [rootId]);

  if (!data) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'Outfit' }}>
        Nie udało się wygenerować drzewa dla wybranej osoby.
        <button onClick={() => setRootId('pawel')} style={{ marginLeft: '10px', padding: '6px 12px' }}>
          Wróć do Pawła
        </button>
      </div>
    );
  }

  const { canvas, nodes, connectors } = data;
  const width = canvas.width * NODE_WIDTH + 200;
  const height = canvas.height * NODE_HEIGHT + 200;

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
        <span style={{ fontWeight: 600 }}>Centrum drzewa:</span>
        <button 
          onClick={() => setRootId('pawel')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'pawel' ? '2px solid #dc2626' : '1px solid #cbd5e1', background: rootId === 'pawel' ? '#fee2e2' : 'white', fontWeight: rootId === 'pawel' ? 600 : 400, cursor: 'pointer' }}
        >
          ❤️ Paweł (Ty)
        </button>
        <button 
          onClick={() => setRootId('gosia')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'gosia' ? '2px solid #9333ea' : '1px solid #cbd5e1', background: rootId === 'gosia' ? '#faf5ff' : 'white', fontWeight: rootId === 'gosia' ? 600 : 400, cursor: 'pointer' }}
        >
          🟣 Gosia
        </button>
        <button 
          onClick={() => setRootId('aleksander_s')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'aleksander_s' ? '2px solid #0284c7' : '1px solid #cbd5e1', background: rootId === 'aleksander_s' ? '#e0f2fe' : 'white', fontWeight: rootId === 'aleksander_s' ? 600 : 400, cursor: 'pointer' }}
        >
          🟦 Aleksander Siudziński
        </button>
        <button 
          onClick={() => setRootId('franciszek')}
          style={{ padding: '6px 12px', borderRadius: '6px', border: rootId === 'franciszek' ? '2px solid #ea580c' : '1px solid #cbd5e1', background: rootId === 'franciszek' ? '#ffedd5' : 'white', fontWeight: rootId === 'franciszek' ? 600 : 400, cursor: 'pointer' }}
        >
          🟠 Dziadek Franek
        </button>

        <div style={{ marginLeft: '15px', borderLeft: '1px solid #cbd5e1', paddingLeft: '15px', display: 'flex', gap: '5px' }}>
          <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} style={{ padding: '4px 10px', cursor: 'pointer' }}>-</button>
          <span style={{ padding: '4px 6px' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} style={{ padding: '4px 10px', cursor: 'pointer' }}>+</button>
        </div>
      </div>

      {/* Canvas Area */}
      <div style={{
        transform: `scale(${zoom})`,
        transformOrigin: 'top left',
        width: `${width}px`,
        height: `${height}px`,
        position: 'relative',
        padding: '50px'
      }}>
        
        {/* SVG Connector Lines */}
        <svg style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}>
          {connectors.map(([x1, y1, x2, y2], idx) => {
            const sx = x1 * NODE_WIDTH + NODE_WIDTH / 2;
            const sy = y1 * NODE_HEIGHT + 40; // Align with center of avatar
            const ex = x2 * NODE_WIDTH + NODE_WIDTH / 2;
            const ey = y2 * NODE_HEIGHT + 40;

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
          })}
        </svg>

        {/* Nodes */}
        {nodes.map(node => {
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
              title="Kliknij, aby ustawić tę osobę jako centrum drzewa"
            >
              <PersonNode data={{ ...customData, isRoot }} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
