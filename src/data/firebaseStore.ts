import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  collection,
  onSnapshot,
  runTransaction,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { sanitize, type Person } from './treeOps';
import { seed, type Photos, type TreeStore } from './store';

// Firestore layout:
//   trees/{TREE_ID}                 { nodes: Person[], updatedAt }
//   trees/{TREE_ID}/history/{auto}  { nodes: Person[] (state before a change), at }
//   trees/{TREE_ID}/photos/{person} { data: "data:image/jpeg;base64,..." }
// Photos live in their own documents to stay under Firestore's 1 MB limit per doc.

const TREE_ID = 'main';

export function createFirebaseStore(config: Record<string, string>): TreeStore {
  const app = initializeApp(config);
  const db = getFirestore(app);
  const treeRef = doc(db, 'trees', TREE_ID);
  const photosRef = collection(db, 'trees', TREE_ID, 'photos');
  const historyRef = collection(db, 'trees', TREE_ID, 'history');

  return {
    mode: 'shared',

    subscribe(onNodes, onError) {
      let seeding = false;
      return onSnapshot(
        treeRef,
        snap => {
          const data = snap.data();
          if (data && Array.isArray(data.nodes)) {
            onNodes(sanitize(data.nodes as Person[]));
          } else if (!seeding) {
            // First visit ever: fill the shared tree with the data from the code.
            seeding = true;
            runTransaction(db, async tx => {
              const fresh = await tx.get(treeRef);
              if (!fresh.exists()) tx.set(treeRef, { nodes: seed(), updatedAt: serverTimestamp() });
            }).catch(onError);
          }
        },
        onError,
      );
    },

    subscribePhotos(onPhotos) {
      return onSnapshot(
        photosRef,
        snap => {
          const photos: Photos = {};
          snap.forEach(d => {
            const v = d.data().data;
            if (typeof v === 'string') photos[d.id] = v;
          });
          onPhotos(photos);
        },
        e => console.error('Photos subscription failed', e),
      );
    },

    async update(change) {
      await runTransaction(db, async tx => {
        const snap = await tx.get(treeRef);
        const current = sanitize(((snap.data()?.nodes as Person[]) || seed()));
        const next = sanitize(change(current));
        // Keep the previous version so a bad edit can be rolled back from the Firebase console.
        tx.set(doc(historyRef), { nodes: current, at: serverTimestamp() });
        tx.set(treeRef, { nodes: JSON.parse(JSON.stringify(next)), updatedAt: serverTimestamp() });
      });
    },

    async setPhoto(id, dataUrl) {
      const ref = doc(photosRef, id);
      if (dataUrl) await setDoc(ref, { data: dataUrl, at: serverTimestamp() });
      else await deleteDoc(ref);
    },
  };
}
