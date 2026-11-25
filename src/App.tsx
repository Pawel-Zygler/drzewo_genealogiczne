import { useEffect, useState } from 'react';
import RelativesTreeViewer from './components/RelativesTreeViewer';
import { createLocalStore, createStore, NoAccessError, type TreeStore } from './data/store';

function App() {
  const [store, setStore] = useState<TreeStore | null>(null);
  const [noAccess, setNoAccess] = useState(false);

  useEffect(() => {
    createStore()
      .then(setStore)
      .catch(e => {
        if (e instanceof NoAccessError) return setNoAccess(true);
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
        {store ? (
          <RelativesTreeViewer store={store} />
        ) : noAccess ? (
          <div className="tree-empty">
            <h2>Brak dostępu do wspólnego drzewa</h2>
            <p>Zaloguj się do Claude kontem, któremu udostępniono to drzewo, i odśwież stronę.</p>
          </div>
        ) : (
          <div className="tree-loading">Wczytywanie…</div>
        )}
      </main>
    </div>
  );
}

export default App;
