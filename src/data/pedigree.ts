import type { Person } from './treeOps';

// Data for the "Rodowód" view (version 3): a pedigree chart numbered the
// classic way (Ahnentafel): 1 = the person, 2 = father, 3 = mother, and the
// parents of number n are 2n and 2n+1.

/** slots[n] = person id of ancestor number n (index 0 unused), or null when unknown. */
export function pedigreeSlots(nodes: Person[], rootId: string, generations: number): (string | null)[] {
  const map = new Map(nodes.map(n => [n.id, n]));
  const slots: (string | null)[] = new Array(2 ** generations).fill(null);
  if (!map.has(rootId)) return slots;
  slots[1] = rootId;
  for (let n = 1; n < 2 ** (generations - 1); n++) {
    const p = slots[n] ? map.get(slots[n]!) : undefined;
    if (!p) continue;
    const [father, mother] = fatherMother(p, map);
    slots[2 * n] = father;
    slots[2 * n + 1] = mother;
  }
  return slots;
}

function fatherMother(p: Person, map: Map<string, Person>): [string | null, string | null] {
  const parents = p.parents.map(r => map.get(r.id)).filter(Boolean) as Person[];
  let father = parents.find(x => x.gender === 'male') || null;
  let mother = parents.find(x => x.gender === 'female' && x !== father) || null;
  // Unknown or equal genders: fill the remaining places in listed order.
  for (const x of parents) {
    if (x === father || x === mother) continue;
    if (!father) father = x;
    else if (!mother) mother = x;
  }
  return [father?.id ?? null, mother?.id ?? null];
}

/** Number of known generations above (and including) the person. */
export function ancestorDepth(nodes: Person[], id: string): number {
  const map = new Map(nodes.map(n => [n.id, n]));
  const memo = new Map<string, number>();
  const go = (cur: string, guard: Set<string>): number => {
    if (memo.has(cur)) return memo.get(cur)!;
    if (guard.has(cur)) return 0;
    guard.add(cur);
    const p = map.get(cur);
    const d = 1 + Math.max(0, ...(p?.parents || []).map(r => go(r.id, guard)));
    guard.delete(cur);
    memo.set(cur, d);
    return d;
  };
  return go(id, new Set());
}

/** A good person to start the chart from: the one with the most known ancestors. */
export function defaultPedigreeRoot(nodes: Person[]): string | null {
  let best: string | null = null;
  let bestScore = -1;
  for (const n of nodes) {
    const score = knownAncestors(nodes, n.id, 5) * 100 + ancestorDepth(nodes, n.id);
    if (score > bestScore) {
      best = n.id;
      bestScore = score;
    }
  }
  return best;
}

/**
 * Vertical placement of the chart's boxes. A box is shown for every known
 * ancestor and, as an "unknown" placeholder, for each missing parent of a known
 * person. Unknown branches collapse, so the chart stays compact.
 * Returns the row (in box heights, may be fractional) of each shown box.
 */
export function pedigreeRows(slots: (string | null)[], generations: number): { rows: Map<number, number>; count: number } {
  const limit = 2 ** generations;
  const shown = (n: number) => n < limit && (!!slots[n] || (n > 1 && !!slots[n >> 1]));
  const rows = new Map<number, number>();
  let next = 0;
  const visit = (n: number): number => {
    const kids = slots[n] ? [2 * n, 2 * n + 1].filter(shown) : [];
    if (kids.length === 0) {
      rows.set(n, next);
      return next++;
    }
    const ys = kids.map(visit);
    const y = (ys[0] + ys[ys.length - 1]) / 2;
    rows.set(n, y);
    return y;
  };
  if (slots[1]) visit(1);
  return { rows, count: next };
}

/** Number of known ancestors within the given generations (the person included). */
export function knownAncestors(nodes: Person[], id: string, generations: number): number {
  return pedigreeSlots(nodes, id, generations).filter(Boolean).length;
}
