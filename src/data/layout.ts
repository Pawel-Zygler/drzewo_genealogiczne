import type { Person } from './treeOps';

// Layout of the whole family ("Wszystkie Rodziny") in which every person is
// drawn exactly once.
//
// relatives-tree can only draw the tree around a single person, and it never
// shows the parents of someone who married into the family. Covering everybody
// with such trees meant drawing whole branches twice (e.g. a new parent of an
// in-law pulled in a second copy of all of their descendants). This layout
// instead places every couple once and hangs the ancestors of in-laws above
// them, to the right of the family they married into.
//
// Output uses the same grid as relatives-tree (half-node units, every node is
// 2x2 cells, connectors run through cell centres), so the viewer renders both
// the same way.

export interface LayoutNode {
  id: string;
  left: number;
  top: number;
}

export interface LayoutResult {
  nodes: LayoutNode[];
  connectors: [number, number, number, number][];
  canvas: { width: number; height: number };
}

type Group = { id: number; members: string[]; gen: number };

interface Block {
  x: Map<string, number>; // left edge, half units
}

const W = 2; // node width in half units

export function layoutAll(people: Person[]): LayoutResult[] {
  const byId = new Map(people.map(p => [p.id, p]));
  const ids = (list: readonly { id: string }[] | undefined) => (list || []).map(r => r.id).filter(id => byId.has(id));
  const parentsOf = (id: string) => ids(byId.get(id)!.parents);
  const childrenOf = (id: string) => ids(byId.get(id)!.children);
  const spousesOf = (id: string) => ids(byId.get(id)!.spouses);

  // --- Generations: parents one row above children, spouses on the same row.
  const gen = new Map<string, number>();
  for (const p of people) {
    if (gen.has(p.id)) continue;
    gen.set(p.id, 0);
    const queue = [p.id];
    const comp: string[] = [];
    while (queue.length) {
      const id = queue.shift()!;
      comp.push(id);
      const g = gen.get(id)!;
      const visit = (other: string, og: number) => {
        if (!gen.has(other)) {
          gen.set(other, og);
          queue.push(other);
        }
      };
      parentsOf(id).forEach(o => visit(o, g - 1));
      childrenOf(id).forEach(o => visit(o, g + 1));
      spousesOf(id).forEach(o => visit(o, g));
    }
    const min = Math.min(...comp.map(id => gen.get(id)!));
    comp.forEach(id => gen.set(id, gen.get(id)! - min));
  }

  // --- Groups: spouses (and co-parents) on the same row share one block.
  const uf = new Map<string, string>();
  const find = (a: string): string => {
    while (uf.get(a) !== a) {
      uf.set(a, uf.get(uf.get(a)!)!);
      a = uf.get(a)!;
    }
    return a;
  };
  const union = (a: string, b: string) => {
    if (gen.get(a) !== gen.get(b)) return;
    uf.set(find(a), find(b));
  };
  people.forEach(p => uf.set(p.id, p.id));
  people.forEach(p => {
    spousesOf(p.id).forEach(s => union(p.id, s));
    const ps = parentsOf(p.id);
    for (let i = 1; i < ps.length; i++) union(ps[0], ps[i]);
  });
  const groupOf = new Map<string, Group>();
  const groups: Group[] = [];
  people.forEach(p => {
    const r = find(p.id);
    let g = groups.find(gr => find(gr.members[0]) === r);
    if (!g) {
      g = { id: groups.length, members: [], gen: gen.get(p.id)! };
      groups.push(g);
    }
    g.members.push(p.id);
    groupOf.set(p.id, g);
  });

  // Someone with several partners stands in the middle, partners with shared
  // children closest to them, alternating right and left.
  const sharedKids = (a: string, b: string) => childrenOf(a).filter(c => parentsOf(c).includes(b)).length;
  groups.forEach(g => {
    if (g.members.length < 3) return;
    const hub = [...g.members].sort((a, b) => spousesOf(b).length - spousesOf(a).length)[0];
    const rest = g.members.filter(m => m !== hub).sort((a, b) => sharedKids(hub, b) - sharedKids(hub, a));
    const left: string[] = [];
    const right: string[] = [];
    rest.forEach((m, i) => (i % 2 === 0 ? right : left).push(m));
    g.members = [...left.reverse(), hub, ...right];
  });

  const parentGroups = (g: Group) => {
    const out: Group[] = [];
    g.members.forEach(m => parentsOf(m).forEach(p => {
      const pg = groupOf.get(p)!;
      if (pg !== g && !out.includes(pg)) out.push(pg);
    }));
    return out;
  };

  // Children of a group, ordered by which partner they come from (left to right).
  const childrenOfGroup = (g: Group) => {
    const kids: string[] = [];
    const rank = (c: string) => {
      const idx = parentsOf(c).map(p => g.members.indexOf(p)).filter(i => i >= 0);
      return idx.reduce((a, b) => a + b, 0) / Math.max(1, idx.length);
    };
    g.members.forEach(m => childrenOf(m).forEach(c => {
      if (!kids.includes(c) && groupOf.get(c) !== g) kids.push(c);
    }));
    return kids
      .map((c, i) => ({ c, i, r: rank(c) }))
      .sort((a, b) => a.r - b.r || a.i - b.i)
      .map(k => k.c);
  };

  const descendantCount = (g: Group, seen = new Set<Group>()): number => {
    if (seen.has(g)) return 0;
    seen.add(g);
    let n = g.members.length;
    childrenOfGroup(g).forEach(c => (n += descendantCount(groupOf.get(c)!, seen)));
    return n;
  };

  const placed = new Set<Group>();

  // --- Block helpers.
  const contour = (b: Block) => {
    const c = new Map<number, [number, number]>();
    b.x.forEach((x, id) => {
      const row = gen.get(id)!;
      const cur = c.get(row);
      c.set(row, cur ? [Math.min(cur[0], x), Math.max(cur[1], x + W)] : [x, x + W]);
    });
    return c;
  };
  const shift = (b: Block, dx: number) => b.x.forEach((x, id) => b.x.set(id, x + dx));
  /** Smallest shift that puts `b` right of everything in `acc` on shared rows. */
  const gapAfter = (acc: Block, b: Block) => {
    const ca = contour(acc);
    const cb = contour(b);
    let dx = -Infinity;
    cb.forEach(([min], row) => {
      const a = ca.get(row);
      if (a) dx = Math.max(dx, a[1] - min);
    });
    return dx;
  };
  const appendRight = (acc: Block, b: Block) => {
    if (acc.x.size === 0) {
      b.x.forEach((x, id) => acc.x.set(id, x));
      return;
    }
    let dx = gapAfter(acc, b);
    if (dx === -Infinity) {
      // No shared rows: keep them apart anyway so the drawing reads left to right.
      const ca = contour(acc);
      const cb = contour(b);
      const maxA = Math.max(...[...ca.values()].map(v => v[1]));
      const minB = Math.min(...[...cb.values()].map(v => v[0]));
      dx = maxA - minB;
    }
    shift(b, dx);
    b.x.forEach((x, id) => acc.x.set(id, x));
  };
  /** Put a row of people centred on `center`, moving right if that spot is taken. */
  const placeRow = (acc: Block, members: string[], center: number) => {
    let left = center - (members.length * W) / 2;
    const row = gen.get(members[0])!;
    const taken = contour(acc).get(row);
    if (taken && left < taken[1] && left + members.length * W > taken[0]) {
      // Prefer the free side closest to the wanted spot.
      const leftSpot = taken[0] - members.length * W;
      left = Math.abs(leftSpot - left) <= Math.abs(taken[1] - left) ? leftSpot : taken[1];
    }
    members.forEach((m, i) => acc.x.set(m, left + i * W));
  };
  const centerOf = (b: Block, ids: string[]) => {
    const xs = ids.filter(id => b.x.has(id)).map(id => b.x.get(id)! + W / 2);
    return xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0;
  };

  // Does this group have someone whose parents still need to be hung above it
  // (anywhere in its branch), so that branch can go last and keep them at the edge.
  const hasInlaws = (g: Group, blood: Set<string>, seen = new Set<Group>()): boolean => {
    if (seen.has(g)) return false;
    seen.add(g);
    if (g.members.some(m => !blood.has(m) && parentGroups({ ...g, members: [m] }).some(pg => !placed.has(pg) && !seen.has(pg)))) return true;
    const kids = childrenOfGroup(g);
    const kidSet = new Set(kids);
    return kids.some(c => {
      const cg = groupOf.get(c)!;
      return !placed.has(cg) && hasInlaws(cg, kidSet, seen);
    });
  };

  /** Group with all its descendants below it, plus in-law ancestors above. */
  const layoutGroup = (g: Group, blood: Set<string>): Block => {
    placed.add(g);
    // Members born into this branch stand on the left, partners who married in
    // on the right, so in-law parents can sit above them without crossing lines.
    if (g.members.length === 2 && !blood.has(g.members[0]) && blood.has(g.members[1])) g.members.reverse();

    const acc: Block = { x: new Map() };
    const kids = childrenOfGroup(g);
    const childGroups: Group[] = [];
    kids.forEach(c => {
      const cg = groupOf.get(c)!;
      if (!placed.has(cg) && !childGroups.includes(cg)) childGroups.push(cg);
    });
    // A child whose partner brings their own parents goes last, so those parents
    // end up at the outer edge of this family.
    const kidSet = new Set(kids);
    childGroups.sort((a, b) => Number(hasInlaws(a, kidSet)) - Number(hasInlaws(b, kidSet)));
    childGroups.forEach(cg => {
      if (placed.has(cg)) return;
      appendRight(acc, layoutGroup(cg, kidSet));
    });

    const placedKids = kids.filter(k => acc.x.has(k));
    placeRow(acc, g.members, placedKids.length ? centerOf(acc, placedKids) : 0);

    // Parents of partners who married in: hang them above their child.
    g.members.forEach(m => {
      if (blood.has(m)) return;
      parentsOf(m).forEach(p => {
        const pg = groupOf.get(p)!;
        if (!placed.has(pg)) attachAbove(acc, pg, m);
      });
    });
    return acc;
  };

  /** Place `pg` (parents of `child`, who is already in `acc`) above `child`,
   *  with their other children's families to the right. */
  const attachAbove = (acc: Block, pg: Group, child: string) => {
    placed.add(pg);
    const kids = childrenOfGroup(pg);
    const kidSet = new Set(kids);
    kids.forEach(c => {
      const cg = groupOf.get(c)!;
      if (placed.has(cg)) return;
      appendRight(acc, layoutGroup(cg, kidSet));
    });
    const placedKids = kids.filter(k => acc.x.has(k));
    placeRow(acc, pg.members, centerOf(acc, placedKids.length ? placedKids : [child]));
    pg.members.forEach(m => {
      parentsOf(m).forEach(p => {
        const gp = groupOf.get(p)!;
        if (!placed.has(gp)) attachAbove(acc, gp, m);
      });
    });
  };

  // --- One cluster per independent family, largest first.
  const roots = groups
    .filter(g => parentGroups(g).length === 0)
    .map(g => ({ g, n: descendantCount(g) }))
    .sort((a, b) => b.n - a.n)
    .map(r => r.g);

  const blocks: Block[] = [];
  const takeRoot = (g: Group) => {
    if (placed.has(g)) return;
    blocks.push(layoutGroup(g, new Set(g.members)));
  };
  roots.forEach(takeRoot);
  groups.forEach(takeRoot); // anything left over (e.g. inconsistent data)

  // The family of 'pawel' (the tree's owner) comes first, the rest by size.
  blocks.sort((a, b) => Number(b.x.has('pawel')) - Number(a.x.has('pawel')));
  return blocks.map(b => toResult(b));

  function toResult(b: Block): LayoutResult {
    const minX = Math.min(...b.x.values());
    const rows = [...b.x.keys()].map(id => gen.get(id)!);
    const minRow = Math.min(...rows);
    const nodes: LayoutNode[] = [...b.x.entries()].map(([id, x]) => ({
      id,
      left: x - minX,
      top: (gen.get(id)! - minRow) * 2,
    }));
    const pos = new Map(nodes.map(n => [n.id, n]));
    const connectors: [number, number, number, number][] = [];
    const cx = (id: string) => pos.get(id)!.left + 1;
    const cy = (id: string) => pos.get(id)!.top + 1;

    // Partners.
    const seenPair = new Set<string>();
    nodes.forEach(n => spousesOf(n.id).forEach(s => {
      const key = [n.id, s].sort().join('|');
      if (seenPair.has(key) || !pos.has(s) || pos.get(s)!.top !== n.top) return;
      seenPair.add(key);
      const lo = Math.min(cx(n.id), cx(s));
      const hi = Math.max(cx(n.id), cx(s));
      connectors.push([lo, cy(n.id), hi, cy(n.id)]);
    }));

    // Parents -> children, one bar per set of parents.
    const families = new Map<string, { parents: string[]; kids: string[] }>();
    nodes.forEach(n => {
      const ps = parentsOf(n.id).filter(p => pos.has(p) && pos.get(p)!.top === n.top - 2);
      if (!ps.length) return;
      const key = [...ps].sort().join('|');
      const f = families.get(key) || { parents: ps, kids: [] };
      f.kids.push(n.id);
      families.set(key, f);
    });
    families.forEach(({ parents, kids }) => {
      const ax = parents.length > 1
        ? (Math.min(...parents.map(cx)) + Math.max(...parents.map(cx))) / 2
        : cx(parents[0]);
      const py = cy(parents[0]);
      const by = py + 1;
      const xs = kids.map(cx);
      connectors.push([ax, py, ax, by]);
      const lo = Math.min(ax, ...xs);
      const hi = Math.max(ax, ...xs);
      if (hi > lo) connectors.push([lo, by, hi, by]);
      kids.forEach(k => connectors.push([cx(k), by, cx(k), by + 1]));
    });

    const width = Math.max(...nodes.map(n => n.left + W));
    const height = Math.max(...nodes.map(n => n.top + 2));
    return { nodes, connectors, canvas: { width, height } };
  }
}
