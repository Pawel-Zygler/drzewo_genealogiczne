import { describe, it, expect } from 'vitest';
import { layoutAll } from './layout';
import { seed } from './store';
import type { Person } from './treeOps';

const withHalina = (): Person[] => {
  const nodes = seed();
  nodes.push({
    id: 'halina', gender: 'female', label: 'Halina', branch: 'other',
    parents: [], children: [{ id: 'jacek', type: 'blood' }], siblings: [], spouses: [],
  } as Person);
  (nodes.find(n => n.id === 'jacek')!.parents as any[]).push({ id: 'halina', type: 'blood' } as any);
  return nodes;
};

function check(nodes: Person[]) {
  const clusters = layoutAll(nodes);
  const all = clusters.flatMap(c => c.nodes.map(n => n.id));
  // Everyone shown, nobody twice.
  expect(all.length).toBe(nodes.length);
  expect(new Set(all).size).toBe(nodes.length);
  // No two people overlap inside a cluster.
  clusters.forEach(c => {
    for (const a of c.nodes) for (const b of c.nodes) {
      if (a !== b && a.top === b.top) expect(Math.abs(a.left - b.left), `${a.id} vs ${b.id}`).toBeGreaterThanOrEqual(2);
    }
  });
  return clusters;
}

describe('layoutAll', () => {
  it('shows every person of the seed tree exactly once', () => {
    check(seed());
  });

  it('hangs a parent of an in-law above them instead of duplicating the branch', () => {
    const clusters = check(withHalina());
    const main = clusters.find(c => c.nodes.some(n => n.id === 'jacek'))!;
    const at = (id: string) => main.nodes.find(n => n.id === id)!;
    expect(main.nodes.some(n => n.id === 'anna_d')).toBe(true);
    expect(at('halina').top).toBe(at('jacek').top - 2);
    expect(at('halina').left).toBe(at('jacek').left);
  });
});
