import { useEffect, useMemo, useState } from 'react';
import type { Person } from './treeOps';
import type { Photos, TreeStore } from './store';

/** Live tree data, photos and a transient error message, shared by the alternative views. */
export function useTree(store: TreeStore) {
  const [nodes, setNodes] = useState<Person[] | null>(null);
  const [photos, setPhotos] = useState<Photos>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const offNodes = store.subscribe(setNodes, e => {
      console.error(e);
      setError('Nie udało się połączyć z bazą danych drzewa.');
    });
    const offPhotos = store.subscribePhotos(setPhotos);
    return () => {
      offNodes();
      offPhotos();
    };
  }, [store]);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  const byId = useMemo(() => new Map((nodes || []).map(n => [n.id, n])), [nodes]);

  return { nodes, byId, photos, error, setError };
}

/** "1916 – 1990", "ur. 1916", "† 1990" or '' from the optional date fields. */
export function lifeSpan(p: Pick<Person, 'born' | 'died'>): string {
  if (p.born && p.died) return `${p.born} – ${p.died}`;
  if (p.born) return `ur. ${p.born}`;
  if (p.died) return `† ${p.died}`;
  return '';
}
