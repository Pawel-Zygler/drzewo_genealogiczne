import { sanitize, type Person } from './treeOps';
import type { Photos, TreeStore } from './store';

// Storage for the Claude artifact build (npm run build:artifact).
// Uses the artifact's shared `db` capability, so everyone the artifact is
// shared with (at Contributor/Editor level) edits the same tree, live.
//
// Layout:
//   people/{personId}   one document per person (the Person object)
//   photos/{personId}   { data: "data:image/jpeg;base64,..." }
//   history/{auto}      { at, before: Person[] (changed people before the edit), removed: string[] }
// One document per person keeps every write small and lets two people edit
// different relatives at the same time without overwriting each other.

type Db = any;

declare global {
  interface Window {
    claude?: { use(name: string): Promise<any> };
  }
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

/** Firestore-style stores reject `undefined`; JSON round-trip drops it. */
const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

export async function createArtifactStore(): Promise<TreeStore | null> {
  const claude = window.claude;
  if (!claude) return null;
  const db: Db = await claude.use('db');
  if (!db) return null;

  let readOnly = false;
  try {
    const user = await claude.use('user');
    const can = user ? await user.can('data.write') : null;
    readOnly = can === false;
  } catch {
    /* unknown: keep editing enabled, a refused write will tell */
  }

  let current: Person[] = [];
  const people = db.collection('people');

  const store: TreeStore = {
    mode: 'shared',
    readOnly,

    subscribe(onNodes, onError) {
      let first = true;
      const timer = setTimeout(() => first && onError({ code: 'timeout' }), 10000);
      return people.onSnapshot(
        (snap: any) => {
          first = false;
          clearTimeout(timer);
          current = sanitize(snap.docs.map((d: any) => ({ ...d.data(), id: d.id }) as Person));
          onNodes(current);
        },
        (e: unknown) => {
          clearTimeout(timer);
          onError(e);
        },
      );
    },

    subscribePhotos(onPhotos) {
      return db.collection('photos').onSnapshot(
        (snap: any) => {
          const photos: Photos = {};
          snap.docs.forEach((d: any) => {
            const v = d.data()?.data;
            if (typeof v === 'string' && v.startsWith('data:image/')) photos[d.id] = v;
          });
          onPhotos(photos);
        },
        (e: unknown) => console.error('Photos subscription failed', e),
      );
    },

    async update(change) {
      const before = current;
      const next = sanitize(change(before));
      const prevById = new Map(before.map(n => [n.id, n]));
      const nextIds = new Set(next.map(n => n.id));

      const changed = next.filter(n => !same(prevById.get(n.id), n));
      const removed = before.filter(n => !nextIds.has(n.id)).map(n => n.id);
      if (!changed.length && !removed.length) return;

      // Optimistic local update so the tree reacts immediately.
      current = next;

      await db.collection('history').add(
        plain({
          at: new Date().toISOString(),
          before: changed.map(n => prevById.get(n.id)).filter(Boolean),
          removed: removed.map(id => prevById.get(id)),
        }),
      ).catch((e: unknown) => console.warn('History write failed', e));

      for (const n of changed) await people.doc(n.id).set(plain(n));
      for (const id of removed) await people.doc(id).delete();
    },

    async setPhoto(id, dataUrl) {
      const ref = db.collection('photos').doc(id);
      if (dataUrl) await ref.set({ data: dataUrl, at: new Date().toISOString() });
      else await ref.delete();
    },
  };
  return store;
}
