import { describe, it, expect } from 'vitest';
import calcTree from 'relatives-tree';
import { nodes } from './familyTree';

describe('Family Tree Data & Relatives-Tree Integration Tests', () => {
  it('should have valid node IDs and no broken relationship links', () => {
    const nodeIds = new Set(nodes.map(n => n.id));
    expect(nodes.length).toBeGreaterThan(0);

    nodes.forEach(node => {
      ['parents', 'children', 'spouses', 'siblings'].forEach(relKey => {
        const relations = (node as any)[relKey] || [];
        relations.forEach((rel: { id: string }) => {
          expect(nodeIds.has(rel.id), `Node ${node.id} references missing ${relKey} ID: ${rel.id}`).toBe(true);
        });
      });
    });
  });

  it('should successfully calculate tree for Pawel root without throwing errors', () => {
    const res = calcTree(nodes, { rootId: 'pawel' });
    expect(res).toBeDefined();
    expect(res.nodes.length).toBeGreaterThan(0);
    expect(res.connectors).toBeDefined();
  });

  it('should achieve 100% node coverage across family clusters', () => {
    const visited = new Set<string>();
    const clusters: any[] = [];

    nodes.forEach(n => {
      if (!visited.has(n.id)) {
        const res = calcTree(nodes, { rootId: n.id });
        if (res.nodes.length > 0) {
          const newNodes = res.nodes.filter(rn => !visited.has(rn.id));
          if (newNodes.length > 0) {
            res.nodes.forEach(rn => visited.add(rn.id));
            clusters.push(res);
          }
        }
      }
    });

    expect(visited.size).toBe(nodes.length);
    expect(clusters.length).toBeGreaterThan(0);
  });
});
