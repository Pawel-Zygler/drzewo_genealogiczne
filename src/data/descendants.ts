import type { Person } from './treeOps';

// Layout for the "Tablica" view (version 2): a descendant chart that flows
// downwards from a founding couple. Couples sit side by side joined by a heart,
// and each marriage's children hang from that heart.

export const D = {
  NODE_W: 150, // width reserved for one person (avatar + text under it)
  AVATAR: 76,
  NODE_H: 150, // avatar + up to three lines of text
  COUPLE_GAP: 40, // space between partners, the heart sits in it
  SIB_GAP: 26,
  ROW_H: 230, // vertical distance between generations
  FAMILY_GAP_X: 140,
  FAMILY_GAP_Y: 110,
  TITLE_H: 56, // room above each family for its chalk title
  PADDING: 40,
  MAX_ROW_W: 2600,
};

export type DNode = { id: string; x: number; y: number; blood: boolean };
export type DHeart = { x: number; y: number };
export type DTitle = { x: number; y: number; text: string };
export type DLayout = {
  nodes: DNode[]; // x = centre of the avatar, y = top of the avatar
  hearts: DHeart[];
  lines: string[]; // SVG path data
  titles: DTitle[];
  width: number;
  height: number;
};

type Unit = {
  id: string;
  spouses: string[];
  // groups[0] = children with no known partner of this person, groups[k] = with spouses[k-1]
  groups: Unit[][];
  width: number;
  coupleW: number;
  childrenW: number;
};

const ids = (rs: readonly { id: string }[] | undefined) => (rs || []).map(r => r.id);

function buildUnit(id: string, map: Map<string, Person>, drawn: Set<string>): Unit | null {
  const p = map.get(id);
  if (!p || drawn.has(id)) return null;
  drawn.add(id);

  const kids = ids(p.children).filter(c => map.has(c));
  const spouses = ids(p.spouses).filter(s => map.has(s) && s !== id);
  // A co-parent who is not listed as a spouse is still shown as a partner.
  kids.forEach(c => {
    ids(map.get(c)!.parents).forEach(op => {
      if (op !== id && map.has(op) && !spouses.includes(op)) spouses.push(op);
    });
  });

  const groups: Unit[][] = [[], ...spouses.map(() => [] as Unit[])];
  kids.forEach(c => {
    const other = ids(map.get(c)!.parents).find(op => op !== id);
    const k = other ? spouses.indexOf(other) + 1 : 0;
    const u = buildUnit(c, map, drawn);
    if (u) groups[Math.max(0, k)].push(u);
  });

  const coupleW = D.NODE_W * (1 + spouses.length) + D.COUPLE_GAP * spouses.length;
  const all = groups.flat();
  const childrenW = all.reduce((s, u) => s + u.width, 0) + D.SIB_GAP * Math.max(0, all.length - 1);
  return { id, spouses, groups, coupleW, childrenW, width: Math.max(coupleW, childrenW) };
}

function depth(u: Unit): number {
  return 1 + Math.max(0, ...u.groups.flat().map(depth));
}

/** Rounded elbow from an anchor down to a child's avatar, the way chalk lines are drawn. */
function elbow(ax: number, ay: number, busY: number, cx: number, cy: number): string {
  const dx = cx - ax;
  if (Math.abs(dx) < 1) return `M ${ax} ${ay} V ${cy}`;
  const r = Math.min(18, Math.abs(dx) / 2, (busY - ay) / 2, (cy - busY) / 2);
  const s = Math.sign(dx);
  return [
    `M ${ax} ${ay}`,
    `V ${busY - r}`,
    `Q ${ax} ${busY} ${ax + s * r} ${busY}`,
    `H ${cx - s * r}`,
    `Q ${cx} ${busY} ${cx} ${busY + r}`,
    `V ${cy}`,
  ].join(' ');
}

function place(u: Unit, left: number, top: number, out: DLayout, blood = true) {
  const A = D.AVATAR;
  const midY = top + A / 2;
  const coupleLeft = left + (u.width - u.coupleW) / 2;
  const px = coupleLeft + D.NODE_W / 2;
  out.nodes.push({ id: u.id, x: px, y: top, blood });

  // Children with only this parent known hang from under the name, so the line never crosses the text.
  const anchors: { x: number; y: number }[] = [{ x: px, y: top + D.NODE_H - 4 }];
  u.spouses.forEach((s, i) => {
    const sx = px + (i + 1) * (D.NODE_W + D.COUPLE_GAP);
    out.nodes.push({ id: s, x: sx, y: top, blood: false });
    out.lines.push(`M ${px + A / 2} ${midY} H ${sx - A / 2}`);
    const hx = sx - (D.NODE_W + D.COUPLE_GAP) / 2;
    out.hearts.push({ x: hx, y: midY });
    anchors.push({ x: hx, y: midY + 9 });
  });

  const childTop = top + D.ROW_H;
  const busY = top + D.NODE_H + (D.ROW_H - D.NODE_H) / 2;
  let cursor = left + (u.width - u.childrenW) / 2;
  u.groups.forEach((group, k) => {
    group.forEach(child => {
      const childCouple = cursor + (child.width - child.coupleW) / 2;
      const cx = childCouple + D.NODE_W / 2;
      out.lines.push(elbow(anchors[k].x, anchors[k].y, busY, cx, childTop));
      place(child, cursor, childTop, out);
      cursor += child.width + D.SIB_GAP;
    });
  });
}

/** Founders: people without parents whose partners have no parents either, biggest family first. */
export function founders(nodes: Person[]): { id: string; label: string; size: number }[] {
  const map = new Map(nodes.map(n => [n.id, n]));
  const res: { id: string; label: string; size: number }[] = [];
  const taken = new Set<string>();
  for (const n of nodes) {
    if (taken.has(n.id) || n.parents.length > 0) continue;
    const partners = ids(n.spouses).filter(s => map.has(s));
    if (partners.some(s => map.get(s)!.parents.length > 0)) continue;
    if (n.children.length === 0) continue;
    partners.forEach(s => taken.add(s));
    taken.add(n.id);
    const size = countDescendants(n.id, map);
    const names = [n, ...partners.map(s => map.get(s)!)].map(p => p.label).join(' i ');
    res.push({ id: n.id, label: names, size });
  }
  return res.sort((a, b) => b.size - a.size);
}

function countDescendants(id: string, map: Map<string, Person>): number {
  const seen = new Set<string>();
  const stack = [id];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    ids(map.get(cur)?.children).forEach(c => stack.push(c));
  }
  return seen.size - 1;
}

/**
 * Lay out the descendants of `rootId`, or with rootId 'all' every founding
 * family next to each other (wrapped into rows) plus anyone left unconnected.
 */
export function layoutDescendants(nodes: Person[], rootId: string): DLayout {
  const map = new Map(nodes.map(n => [n.id, n]));
  const out: DLayout = { nodes: [], hearts: [], lines: [], titles: [], width: 0, height: 0 };
  const drawn = new Set<string>();

  const families: { unit: Unit; title: string }[] = [];
  if (rootId !== 'all' && map.has(rootId)) {
    const u = buildUnit(rootId, map, drawn);
    if (u) families.push({ unit: u, title: '' });
  } else {
    founders(nodes).forEach(f => {
      const u = buildUnit(f.id, map, drawn);
      if (u) families.push({ unit: u, title: `Ród: ${f.label}` });
    });
  }

  let x = D.PADDING;
  let y = D.PADDING;
  let rowH = 0;
  let maxW = 0;
  const titleH = rootId === 'all' ? D.TITLE_H : 0;
  families.forEach(({ unit, title }) => {
    const w = unit.width;
    const h = titleH + (depth(unit) - 1) * D.ROW_H + D.NODE_H;
    if (x > D.PADDING && x + w > D.MAX_ROW_W) {
      x = D.PADDING;
      y += rowH + D.FAMILY_GAP_Y;
      rowH = 0;
    }
    if (title) out.titles.push({ x: x + w / 2, y: y + 30, text: title });
    place(unit, x, y + titleH, out);
    x += w + D.FAMILY_GAP_X;
    rowH = Math.max(rowH, h);
    maxW = Math.max(maxW, x - D.FAMILY_GAP_X);
  });

  if (rootId === 'all') {
    // People who are in no family chart: neither a descendant nor a partner of one.
    const shown = new Set(out.nodes.map(n => n.id));
    const rest = nodes.filter(n => !shown.has(n.id));
    if (rest.length) {
      if (families.length) y += rowH + D.FAMILY_GAP_Y;
      const perRow = Math.max(1, Math.floor((D.MAX_ROW_W - D.PADDING) / (D.NODE_W + D.SIB_GAP)));
      const rowW = Math.min(rest.length, perRow) * (D.NODE_W + D.SIB_GAP) - D.SIB_GAP;
      out.titles.push({ x: D.PADDING + rowW / 2, y: y + 30, text: 'Pozostali' });
      rest.forEach((p, i) => {
        const col = i % perRow;
        const row = Math.floor(i / perRow);
        out.nodes.push({
          id: p.id,
          x: D.PADDING + col * (D.NODE_W + D.SIB_GAP) + D.NODE_W / 2,
          y: y + D.TITLE_H + row * (D.NODE_H + 30),
          blood: true,
        });
      });
      const rows = Math.ceil(rest.length / perRow);
      rowH = D.TITLE_H + rows * (D.NODE_H + 30);
      maxW = Math.max(maxW, D.PADDING + rowW);
    }
  }

  out.width = maxW + D.PADDING;
  out.height = y + rowH + D.PADDING;
  return out;
}
