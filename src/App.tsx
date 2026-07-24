import React from 'react';
import FamilyTreeViewer from './components/FamilyTreeViewer';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>Drzewo Genealogiczne</h1>
        <p>Historia naszej rodziny</p>
      </header>
      <main className="tree-container">
        <FamilyTreeViewer />
      </main>
    </div>
  );
}

export default App;
