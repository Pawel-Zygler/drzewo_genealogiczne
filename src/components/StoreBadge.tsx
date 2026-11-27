import type { TreeStore } from '../data/store';

export default function StoreBadge({ store }: { store: TreeStore }) {
  return (
    <span
      className={`store-badge ${store.mode}`}
      title={store.mode === 'shared'
        ? 'Zmiany zapisują się we wspólnej bazie i od razu widzi je każdy, kto ma link.'
        : 'Brak konfiguracji bazy danych: zmiany zapisują się tylko w tej przeglądarce.'}
    >
      {store.readOnly ? '● Tylko podgląd' : store.mode === 'shared' ? '● Wspólne drzewo' : '● Tryb lokalny'}
    </span>
  );
}
