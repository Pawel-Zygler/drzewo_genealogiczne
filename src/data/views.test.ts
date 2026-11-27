import { describe, expect, it } from 'vitest';
import { seed } from './store';
import { founders, layoutDescendants } from './descendants';
import { defaultPedigreeRoot, pedigreeRows, pedigreeSlots } from './pedigree';

describe('descendant chart (version 2)', () => {
  const nodes = seed();

  it('shows every person exactly once across all families', () => {
    const ids = layoutDescendants(nodes, 'all').nodes.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ids)).toEqual(new Set(nodes.map(n => n.id)));
  });

  it('starts with the biggest founding family', () => {
    expect(founders(nodes)[0].id).toBe('walenty');
  });

  it('draws one heart per couple', () => {
    const l = layoutDescendants(nodes, 'franciszek');
    expect(l.hearts.length).toBeGreaterThanOrEqual(3); // three wives
  });
});

describe('pedigree chart (version 3)', () => {
  const nodes = seed();

  it('numbers father as 2n and mother as 2n+1', () => {
    const s = pedigreeSlots(nodes, 'tosia', 4);
    expect(s[1]).toBe('tosia');
    expect(s[2]).toBe('pawel');
    expect(s[3]).toBe('gosia');
    expect(s[6]).toBe('jacek');
    expect(s[7]).toBe('hania');
  });

  it('defaults to the person with most known ancestors', () => {
    expect(['tosia', 'janek']).toContain(defaultPedigreeRoot(nodes));
  });

  it('collapses unknown branches into single placeholder rows', () => {
    const s = pedigreeSlots(nodes, 'tosia', 3);
    const { rows, count } = pedigreeRows(s, 3);
    expect(count).toBe(4); // 4, 5 (unknown parents of Paweł), 6, 7
    expect(rows.get(1)).toBe((rows.get(2)! + rows.get(3)!) / 2);
  });
});
