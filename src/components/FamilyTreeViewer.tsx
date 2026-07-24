import React, { useState, useMemo } from 'react';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { initialNodes, initialEdges } from '../data/familyTree';
import PersonNode from './PersonNode';

const Y_SPACING = 220;
const X_SPACING = 160;

function calculateGenerationLayout(nodes: any[], filterBranch: string) {
  let filteredNodes = nodes;
  if (filterBranch === 'gosi') {
    filteredNodes = nodes.filter(n => ['dominik', 'siudzinski', 'main'].includes(n.data.branch));
  } else if (filterBranch === 'pawla') {
    filteredNodes = nodes.filter(n => ['franciszek', 'leon', 'main'].includes(n.data.branch));
  } else if (filterBranch === 'main') {
    filteredNodes = nodes.filter(n => ['main'].includes(n.data.branch));
  }

  const validIds = new Set(filteredNodes.map(n => n.id));
  const filteredEdges = initialEdges.filter(e => validIds.has(e.source) && validIds.has(e.target));

  const genMap: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
  
  filteredNodes.forEach(node => {
    const gen = node.data.gen || 1;
    if (!genMap[gen]) genMap[gen] = [];
    genMap[gen].push(node);
  });

  const branchOrder: Record<string, number> = { dominik: 1, siudzinski: 2, main: 3, zygler: 3, franciszek: 4, leon: 5, other: 6 };
  
  const layoutedNodes: any[] = [];

  for (let gen = 1; gen <= 6; gen++) {
    const genNodes = genMap[gen] || [];
    genNodes.sort((a, b) => (branchOrder[a.data.branch] || 99) - (branchOrder[b.data.branch] || 99));

    const totalWidth = genNodes.length * X_SPACING;
    const startX = -totalWidth / 2;

    genNodes.forEach((node, idx) => {
      layoutedNodes.push({
        ...node,
        targetPosition: 'top',
        sourcePosition: 'bottom',
        position: {
          x: startX + idx * X_SPACING,
          y: (gen - 1) * Y_SPACING,
        },
      });
    });
  }

  return { nodes: layoutedNodes, edges: filteredEdges };
}

export default function FamilyTreeViewer() {
  const [filterBranch, setFilterBranch] = useState<string>('all');

  const { nodes: layoutedNodes, edges: layoutedEdges } = useMemo(() => {
    return calculateGenerationLayout(initialNodes, filterBranch);
  }, [filterBranch]);

  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  React.useEffect(() => {
    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [layoutedNodes, layoutedEdges, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({ person: PersonNode }), []);

  const configuredNodes = useMemo(() => {
    return nodes.map(n => ({ ...n, type: 'person' }));
  }, [nodes]);

  const defaultEdgeOptions = { style: { stroke: '#64748b', strokeWidth: 1.5 }, type: 'step' };

  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc', position: 'relative' }}>
      <ReactFlow
        nodes={configuredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background />
        <Controls />
        
        {/* Top Control Panel: Branch Switcher */}
        <Panel position="top-left" style={{ background: 'white', padding: '12px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontFamily: 'Outfit', fontSize: '13px', marginRight: '4px' }}>Widok:</span>
          <button 
            onClick={() => setFilterBranch('all')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: filterBranch === 'all' ? '2px solid #2563eb' : '1px solid #cbd5e1', background: filterBranch === 'all' ? '#eff6ff' : 'white', fontWeight: filterBranch === 'all' ? 600 : 400, cursor: 'pointer', fontFamily: 'Outfit', fontSize: '12px' }}
          >
            🌐 Pełne Drzewo
          </button>
          <button 
            onClick={() => setFilterBranch('gosi')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: filterBranch === 'gosi' ? '2px solid #9333ea' : '1px solid #cbd5e1', background: filterBranch === 'gosi' ? '#faf5ff' : 'white', fontWeight: filterBranch === 'gosi' ? 600 : 400, cursor: 'pointer', fontFamily: 'Outfit', fontSize: '12px' }}
          >
            🟣 Rodzina Gosi (Dominik & Siudzińscy)
          </button>
          <button 
            onClick={() => setFilterBranch('pawla')}
            style={{ padding: '6px 12px', borderRadius: '6px', border: filterBranch === 'pawla' ? '2px solid #ea580c' : '1px solid #cbd5e1', background: filterBranch === 'pawla' ? '#fff7ed' : 'white', fontWeight: filterBranch === 'pawla' ? 600 : 400, cursor: 'pointer', fontFamily: 'Outfit', fontSize: '12px' }}
          >
            🟠 Gałąź Franciszka & Leona
          </button>
        </Panel>

        <Panel position="top-right" style={{ background: 'white', padding: '15px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'}}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontFamily: 'Outfit' }}>Legenda Gałęzi</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', fontFamily: 'Outfit' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#fee2e2', border: '2px solid #dc2626', borderRadius: '4px' }}></div> Zyglerowie (Ty i Dzieci)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#e0f2fe', border: '2px solid #0284c7', borderRadius: '4px' }}></div> Dominik</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#f3e8ff', border: '2px solid #9333ea', borderRadius: '4px' }}></div> Siudzińscy</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#ffedd5', border: '2px solid #ea580c', borderRadius: '4px' }}></div> Franciszek</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '14px', height: '14px', background: '#dcfce7', border: '2px solid #16a34a', borderRadius: '4px' }}></div> Leon</div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
