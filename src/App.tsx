import React, { useEffect, useState } from 'react';
import RelativesTreeViewer from './components/RelativesTreeViewer';
import { createLocalStore, createStore, type TreeStore } from './data/store';

function App() {
  const [store, setStore] = useState<TreeStore | null>(null);

  useEffect(() => {
    createStore()
      .then(setStore)
      .catch(e => {
        console.error('Shared storage unavailable, using local mode', e);
        setStore(createLocalStore());
      });
  }, []);

  return (
    <div className="app-container">
      <header className="header">
        <h1>Drzewo Genealogiczne</h1>
        <p>Historia naszej rodziny. Kliknij na osobę, aby ją edytować lub dodać krewnych.</p>
      </header>
      <main className="tree-container">
        {store ? <RelativesTreeViewer store={store} /> : <div className="tree-loading">Wczytywanie…</div>}
      </main>
    </div>
  );
}

export default App;
