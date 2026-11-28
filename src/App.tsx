import { useEffect, useState } from 'react';
import RelativesTreeViewer from './components/RelativesTreeViewer';
import ChalkboardTree from './components/ChalkboardTree';
import PedigreeChart from './components/PedigreeChart';
import { createLocalStore, createStore, NoAccessError, type TreeStore } from './data/store';

const VERSIONS = [
  { id: '1', label: 'Klasyczne', title: 'Wersja 1: całe drzewo z portretami' },
  { id: '2', label: 'Tablica', title: 'Wersja 2: potomkowie od założycieli rodu, na kredowej tablicy' },
  { id: '3', label: 'Rodowód', title: 'Wersja 3: przodkowie jednej osoby, numerowani jak w tablicy rodowodowej' },
] as const;
type Version = (typeof VERSIONS)[number]['id'];

const LS_VERSION = 'drzewo.widok';

function initialVersion(): Version {
  const fromUrl = new URLSearchParams(window.location.search).get('widok');
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(LS_VERSION);
  } catch {}
  const v = fromUrl || saved;
  return VERSIONS.some(x => x.id === v) ? (v as Version) : '1';
}

function App() {
  const [store, setStore] = useState<TreeStore | null>(null);
  const [noAccess, setNoAccess] = useState(false);
  const [version, setVersion] = useState<Version>(initialVersion);

  useEffect(() => {
    createStore()
      .then(setStore)
      .catch(e => {
        if (e instanceof NoAccessError) return setNoAccess(true);
        console.error('Shared storage unavailable, using local mode', e);
        setStore(createLocalStore());
      });
  }, []);

  const choose = (v: Version) => {
    setVersion(v);
    try {
      localStorage.setItem(LS_VERSION, v);
    } catch {}
    try {
      // Not allowed everywhere (e.g. inside the Claude artifact frame); the choice still works without it.
      const url = new URL(window.location.href);
      url.searchParams.set('widok', v);
      window.history.replaceState(null, '', url);
    } catch {}
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-text">
          <h1>Drzewo Genealogiczne</h1>
          <p>Historia naszej rodziny. Kliknij na osobę, aby ją edytować lub dodać krewnych.</p>
        </div>
        <nav className="version-switch" aria-label="Wersja widoku">
          {VERSIONS.map(v => (
            <button
              key={v.id}
              className={version === v.id ? 'on' : ''}
              aria-pressed={version === v.id}
              title={v.title}
              onClick={() => choose(v.id)}
            >
              <b>{v.id}</b> {v.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="tree-container">
        {!store ? (
          noAccess ? (
            <div className="tree-empty">
              <h2>Brak dostępu do wspólnego drzewa</h2>
              <p>Zaloguj się do Claude kontem, któremu udostępniono to drzewo, i odśwież stronę.</p>
            </div>
          ) : (
            <div className="tree-loading">Wczytywanie…</div>
          )
        ) : version === '2' ? (
          <ChalkboardTree store={store} />
        ) : version === '3' ? (
          <PedigreeChart store={store} />
        ) : (
          <RelativesTreeViewer store={store} />
        )}
      </main>
    </div>
  );
}

export default App;
