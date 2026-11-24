import { describe, it, expect } from 'vitest';
import calcTree from 'relatives-tree';
import { nodes as seedNodes } from './familyTree';
import { addPerson, addRelation, removeRelation, deletePerson, updatePerson, canLink, makeId, sanitize, type Person } from './treeOps';

const base = (): Person[] => JSON.parse(JSON.stringify(seedNodes));
const get = (ns: Person[], id: string) => ns.find(n => n.id === id)!;
const ids = (list: readonly { id: string }[]) => list.map(r => r.id).sort();

function expectSymmetric(ns: Person[]) {
  const map = new Map(ns.map(n => [n.id, n]));
  ns.forEach(n => {
    n.parents.forEach(p => expect(ids(map.get(p.id)!.children)).toContain(n.id));
    n.children.forEach(c => expect(ids(map.get(c.id)!.parents)).toContain(n.id));
    n.spouses.forEach(s => expect(ids(map.get(s.id)!.spouses)).toContain(n.id));
    n.siblings.forEach(s => expect(ids(map.get(s.id)!.siblings)).toContain(n.id));
  });
}

describe('treeOps', () => {
  it('adds a child with a co-parent and links siblings', () => {
    const { nodes, id } = addPerson(base(), { label: 'Zosia', gender: 'female' as any }, { to: 'pawel', kind: 'child', coParentId: 'gosia' });
    expect(ids(get(nodes, id).parents)).toEqual(['gosia', 'pawel']);
    expect(ids(get(nodes, id).siblings)).toEqual(['janek', 'tosia']);
    expect(ids(get(nodes, 'tosia').siblings)).toContain(id);
    expectSymmetric(nodes);
    expect(() => calcTree(nodes, { rootId: id })).not.toThrow();
  });

  it('adds a parent and spouse to someone without them', () => {
    let { nodes, id: dad } = addPerson(base(), { label: 'Tata Marzeny', gender: 'male' as any }, { to: 'marzena_m', kind: 'parent' });
    const r = addPerson(nodes, { label: 'Mama Marzeny', gender: 'female' as any }, { to: dad, kind: 'spouse' });
    nodes = addRelation(r.nodes, 'marzena_m', r.id, 'parent');
    expect(ids(get(nodes, 'marzena_m').parents)).toEqual([dad, r.id].sort());
    expect(ids(get(nodes, dad).spouses)).toEqual([r.id]);
    expectSymmetric(nodes);
    expect(() => calcTree(nodes, { rootId: 'marzena_m' })).not.toThrow();
  });

  it('gives a new sibling the same parents', () => {
    const { nodes, id } = addPerson(base(), { label: 'Brat', gender: 'male' as any }, { to: 'janek', kind: 'sibling' });
    expect(ids(get(nodes, id).parents)).toEqual(['gosia', 'pawel']);
    expectSymmetric(nodes);
  });

  it('refuses invalid links', () => {
    const ns = base();
    expect(canLink(ns, 'tosia', 'tosia', 'spouse')).not.toBeNull();
    expect(canLink(ns, 'tosia', 'pawel', 'parent')).not.toBeNull(); // already linked
    expect(canLink(ns, 'pawel', 'tosia', 'parent')).not.toBeNull(); // descendant as parent
    const { nodes, id } = addPerson(ns, { label: 'X', gender: 'male' as any });
    expect(canLink(nodes, 'tosia', id, 'parent')).not.toBeNull(); // third parent
    expect(addRelation(nodes, 'tosia', id, 'parent')).toBe(nodes);
  });

  it('removes relations and people without dangling references', () => {
    let ns = removeRelation(base(), 'pawel', 'gosia');
    expect(get(ns, 'pawel').spouses).toHaveLength(0);
    expect(get(ns, 'gosia').spouses).toHaveLength(0);
    ns = deletePerson(ns, 'janek');
    expect(ns.find(n => n.id === 'janek')).toBeUndefined();
    expect(ids(get(ns, 'tosia').siblings)).toEqual([]);
    expectSymmetric(ns);
    expect(sanitize(ns)).toEqual(ns);
  });

  it('updates fields and drops emptied ones', () => {
    let ns = updatePerson(base(), 'janek', { born: '2020', notes: 'x' });
    expect(get(ns, 'janek').born).toBe('2020');
    ns = updatePerson(ns, 'janek', { notes: '' });
    expect(get(ns, 'janek').notes).toBeUndefined();
  });

  it('makes unique ascii ids', () => {
    const ns = base();
    expect(makeId('Paweł', ns)).toBe('pawel_2');
    expect(makeId('Żółć Ąę', ns)).toBe('zolc_ae');
  });
});
