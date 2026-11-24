import type { ExtNode } from './familyTree';

// Pure, immutable operations on the family tree. Every operation keeps the
// relations symmetric (if A lists B as a child, B lists A as a parent), which
// relatives-tree needs to lay the tree out without errors.

export type Person = ExtNode & {
  born?: string;
  died?: string;
  notes?: string;
};

export type RelKind = 'parent' | 'child' | 'spouse' | 'sibling';

export type PersonFields = Partial<Pick<Person, 'label' | 'role' | 'gender' | 'deceased' | 'born' | 'died' | 'notes'>>;

type RelList = 'parents' | 'children' | 'spouses' | 'siblings';

const LIST: Record<RelKind, RelList> = {
  parent: 'parents',
  child: 'children',
  spouse: 'spouses',
  sibling: 'siblings',
};

const INVERSE: Record<RelKind, RelKind> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
  sibling: 'sibling',
};

export const MAX_PARENTS = 2;

const clone = (nodes: Person[]): Person[] =>
  nodes.map(n => ({
    ...n,
    parents: [...n.parents],
    children: [...n.children],
    spouses: [...n.spouses],
    siblings: [...n.siblings],
  }));

const has = (list: readonly { id: string }[], id: string) => list.some(r => r.id === id);

function link(map: Map<string, Person>, aId: string, bId: string, kind: RelKind) {
  // "kind" says what b is to a: link(a, b, 'parent') means b is a's parent.
  const a = map.get(aId);
  const b = map.get(bId);
  if (!a || !b || aId === bId) return;
  const type = kind === 'spouse' ? 'married' : 'blood';
  const aList = a[LIST[kind]] as any[];
  const bList = b[LIST[INVERSE[kind]]] as any[];
  if (!has(aList, bId)) aList.push({ id: bId, type });
  if (!has(bList, aId)) bList.push({ id: aId, type });
}

function unlink(map: Map<string, Person>, aId: string, bId: string, kind: RelKind) {
  const a = map.get(aId);
  const b = map.get(bId);
  if (a) (a as any)[LIST[kind]] = a[LIST[kind]].filter(r => r.id !== bId);
  if (b) (b as any)[LIST[INVERSE[kind]]] = b[LIST[INVERSE[kind]]].filter(r => r.id !== aId);
}

/** Children of the same parent are siblings; relatives-tree expects them listed. */
function syncSiblings(map: Map<string, Person>, parentId: string) {
  const parent = map.get(parentId);
  if (!parent) return;
  const kids = parent.children.map(c => c.id).filter(id => map.has(id));
  for (const a of kids) for (const b of kids) if (a !== b) link(map, a, b, 'sibling');
}

export function canLink(nodes: Person[], aId: string, bId: string, kind: RelKind): string | null {
  if (aId === bId) return 'Nie można połączyć osoby z samą sobą.';
  const a = nodes.find(n => n.id === aId);
  const b = nodes.find(n => n.id === bId);
  if (!a || !b) return 'Nie znaleziono osoby.';
  const already = (['parent', 'child', 'spouse', 'sibling'] as RelKind[]).find(k => has(a[LIST[k]], bId));
  if (already) return 'Te osoby są już ze sobą powiązane.';
  if (kind === 'parent' && a.parents.length >= MAX_PARENTS) return 'Ta osoba ma już dwoje rodziców.';
  if (kind === 'child' && b.parents.length >= MAX_PARENTS) return 'To dziecko ma już dwoje rodziców.';
  if (kind === 'parent' && isDescendant(nodes, aId, bId)) return 'Potomek nie może być rodzicem swojego przodka.';
  if (kind === 'child' && isDescendant(nodes, bId, aId)) return 'Przodek nie może być dzieckiem swojego potomka.';
  return null;
}

/** Is `maybeDesc` a descendant of `ancestor`? */
function isDescendant(nodes: Person[], ancestor: string, maybeDesc: string): boolean {
  const map = new Map(nodes.map(n => [n.id, n]));
  const stack = [ancestor];
  const seen = new Set<string>();
  while (stack.length) {
    const id = stack.pop()!;
    if (id === maybeDesc && id !== ancestor) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    map.get(id)?.children.forEach(c => stack.push(c.id));
  }
  return false;
}

/** Connect two existing people. `kind` = what `otherId` is to `personId`. */
export function addRelation(nodes: Person[], personId: string, otherId: string, kind: RelKind, coParentId?: string): Person[] {
  if (canLink(nodes, personId, otherId, kind)) return nodes;
  const next = clone(nodes);
  const map = new Map(next.map(n => [n.id, n]));
  link(map, personId, otherId, kind);

  if (kind === 'child') {
    if (coParentId && canLink(next, otherId, coParentId, 'parent') === null) link(map, otherId, coParentId, 'parent');
    map.get(otherId)!.parents.forEach(p => syncSiblings(map, p.id));
  } else if (kind === 'parent') {
    syncSiblings(map, otherId);
  } else if (kind === 'sibling') {
    // A new sibling shares the person's known parents.
    const person = map.get(personId)!;
    const other = map.get(otherId)!;
    if (other.parents.length === 0) {
      person.parents.forEach(p => link(map, otherId, p.id, 'parent'));
      person.parents.forEach(p => syncSiblings(map, p.id));
    }
  }
  return next;
}

export function removeRelation(nodes: Person[], personId: string, otherId: string): Person[] {
  const next = clone(nodes);
  const map = new Map(next.map(n => [n.id, n]));
  (['parent', 'child', 'spouse', 'sibling'] as RelKind[]).forEach(k => unlink(map, personId, otherId, k));
  return next;
}

export function makeId(label: string, nodes: Person[]): string {
  const base =
    label
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/ł/g, 'l')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || 'osoba';
  const ids = new Set(nodes.map(n => n.id));
  if (!ids.has(base)) return base;
  let i = 2;
  while (ids.has(`${base}_${i}`)) i++;
  return `${base}_${i}`;
}

export function addPerson(
  nodes: Person[],
  fields: PersonFields & { label: string; gender: Person['gender'] },
  relation?: { to: string; kind: RelKind; coParentId?: string },
  id = makeId(fields.label, nodes),
): { nodes: Person[]; id: string } {
  const person: Person = {
    id,
    branch: (relation && nodes.find(n => n.id === relation.to)?.branch) || 'other',
    parents: [],
    children: [],
    spouses: [],
    siblings: [],
    ...clean(fields),
  } as Person;
  let next = [...nodes, person];
  if (relation) next = addRelation(next, relation.to, id, relation.kind, relation.coParentId);
  return { nodes: next, id };
}

export function updatePerson(nodes: Person[], id: string, fields: PersonFields): Person[] {
  return nodes.map(n => {
    if (n.id !== id) return n;
    const merged: any = { ...n, ...fields };
    Object.keys(merged).forEach(k => (merged[k] === undefined || merged[k] === '') && k !== 'label' && delete merged[k]);
    return merged;
  });
}

export function deletePerson(nodes: Person[], id: string): Person[] {
  return nodes
    .filter(n => n.id !== id)
    .map(n => ({
      ...n,
      parents: n.parents.filter(r => r.id !== id),
      children: n.children.filter(r => r.id !== id),
      spouses: n.spouses.filter(r => r.id !== id),
      siblings: n.siblings.filter(r => r.id !== id),
    }));
}

function clean<T extends object>(obj: T): T {
  const out: any = {};
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== '') out[k] = typeof v === 'string' ? v.trim() : v;
  });
  return out;
}

/** Drop dangling references (e.g. after concurrent edits) so the layout never crashes. */
export function sanitize(nodes: Person[]): Person[] {
  const ids = new Set(nodes.map(n => n.id));
  return nodes.map(n => ({
    ...n,
    parents: (n.parents || []).filter(r => ids.has(r.id)),
    children: (n.children || []).filter(r => ids.has(r.id)),
    spouses: (n.spouses || []).filter(r => ids.has(r.id)),
    siblings: (n.siblings || []).filter(r => ids.has(r.id)),
  }));
}
