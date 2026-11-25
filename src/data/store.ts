import { nodes as seedNodes } from './familyTree';
import { sanitize, type Person } from './treeOps';

// Where the tree lives. With a Firebase config (VITE_FIREBASE_CONFIG) the tree
// is shared: everyone with the link sees and edits the same data, live.
// Without it the app falls back to this browser's localStorage.

export type Photos = Record<string, string>;

export interface TreeStore {
  mode: 'shared' | 'local';
  /** The viewer may look but not change anything. */
  readOnly?: boolean;
  subscribe(onNodes: (nodes: Person[]) => void, onError: (e: unknown) => void): () => void;
  subscribePhotos(onPhotos: (photos: Photos) => void): () => void;
  /** Apply a change to the latest version of the tree (safe with concurrent editors). */
  update(change: (nodes: Person[]) => Person[]): Promise<void>;
  setPhoto(personId: string, dataUrl: string | null): Promise<void>;
}

export const seed = (): Person[] => sanitize(JSON.parse(JSON.stringify(seedNodes)));

export function readFirebaseConfig(): Record<string, string> | null {
  const raw = import.meta.env.VITE_FIREBASE_CONFIG as string | undefined;
  if (!raw || !raw.trim()) return null;
  try {
    // Accept plain JSON or the JS object literal copied from the Firebase console.
    const json = raw
      .trim()
      .replace(/^[^{]*/, '')
      .replace(/[^}]*$/, '')
      .replace(/([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)\s*:/g, '$1"$2":')
      .replace(/'/g, '"')
      .replace(/,\s*}/g, '}');
    const cfg = JSON.parse(json);
    return cfg.projectId && cfg.apiKey ? cfg : null;
  } catch (e) {
    console.error('VITE_FIREBASE_CONFIG is not valid JSON', e);
    return null;
  }
}

export class NoAccessError extends Error {}

export async function createStore(): Promise<TreeStore> {
  if (import.meta.env.MODE === 'artifact') {
    const { createArtifactStore } = await import('./artifactStore');
    const store = await createArtifactStore();
    if (!store) throw new NoAccessError('shared storage unavailable');
    return store;
  }
  const cfg = readFirebaseConfig();
  if (cfg) {
    const { createFirebaseStore } = await import('./firebaseStore');
    return createFirebaseStore(cfg);
  }
  return createLocalStore();
}

const LS_NODES = 'drzewo.nodes.v1';
const LS_PHOTOS = 'drzewo.photos.v1';

function lsGet<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('localStorage write failed', e);
  }
}

export function createLocalStore(): TreeStore {
  let nodes: Person[] = sanitize(lsGet<Person[]>(LS_NODES) || seed());
  let photos: Photos = lsGet<Photos>(LS_PHOTOS) || {};
  const nodeSubs = new Set<(n: Person[]) => void>();
  const photoSubs = new Set<(p: Photos) => void>();

  return {
    mode: 'local',
    subscribe(cb) {
      nodeSubs.add(cb);
      cb(nodes);
      return () => nodeSubs.delete(cb);
    },
    subscribePhotos(cb) {
      photoSubs.add(cb);
      cb(photos);
      return () => photoSubs.delete(cb);
    },
    async update(change) {
      nodes = sanitize(change(nodes));
      lsSet(LS_NODES, nodes);
      nodeSubs.forEach(cb => cb(nodes));
    },
    async setPhoto(id, dataUrl) {
      photos = { ...photos };
      if (dataUrl) photos[id] = dataUrl;
      else delete photos[id];
      lsSet(LS_PHOTOS, photos);
      photoSubs.forEach(cb => cb(photos));
    },
  };
}
