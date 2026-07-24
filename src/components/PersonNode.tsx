import React from 'react';
import { Handle, Position } from 'reactflow';

const branchColors: Record<string, { bg: string; border: string }> = {
  dominik: { bg: '#e0f2fe', border: '#0284c7' },
  siudzinski: { bg: '#f3e8ff', border: '#9333ea' },
  franciszek: { bg: '#ffedd5', border: '#ea580c' },
  leon: { bg: '#dcfce7', border: '#16a34a' },
  main: { bg: '#fee2e2', border: '#dc2626' },
  other: { bg: '#f1f5f9', border: '#64748b' }
};

function PersonNode({ data }: { data: any }) {
  const branch = data.branch || 'other';
  const colors = branchColors[branch];

  return (
    <div style={{
      padding: '10px 20px',
      borderRadius: '8px',
      background: colors.bg,
      border: `2px solid ${colors.border}`,
      minWidth: '150px',
      textAlign: 'center',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#555', opacity: 0 }} />
      <div style={{ fontWeight: 600, color: '#1e293b' }}>{data.label}</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#555', opacity: 0 }} />
    </div>
  );
}

export default PersonNode;
