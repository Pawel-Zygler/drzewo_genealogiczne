import React from 'react';
import RelativesTreeViewer from './components/RelativesTreeViewer';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Drzewo Genealogiczne</h1>
        <p>Historia naszej rodziny (Kliknij na osobę, aby skupić na niej drzewo)</p>
      </header>
      <main className="tree-container">
        <RelativesTreeViewer />
      </main>
    </div>
  );
}

export default App;
