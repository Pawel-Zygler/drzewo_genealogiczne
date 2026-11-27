import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  addPerson,
  addRelation,
  canLink,
  deletePerson,
  removeRelation,
  updatePerson,
  MAX_PARENTS,
  type Person,
  type PersonFields,
  type RelKind,
} from '../data/treeOps';
import type { Photos, TreeStore } from '../data/store';
import { avatarUrl } from './PersonNode';

type Props = {
  /** null = adding a brand new, unconnected person */
  personId: string | null;
  nodes: Person[];
  photos: Photos;
  store: TreeStore;
  onSelect: (id: string | null) => void;
  onFocus: (id: string) => void;
  onError: (msg: string) => void;
};

const KIND_LABEL: Record<RelKind, string> = {
  parent: 'rodzica',
  spouse: 'małżonka / partnera',
  child: 'dziecko',
  sibling: 'rodzeństwo',
};

const GROUPS: { key: 'parents' | 'spouses' | 'siblings' | 'children'; title: string }[] = [
  { key: 'parents', title: 'Rodzice' },
  { key: 'spouses', title: 'Małżonkowie' },
  { key: 'siblings', title: 'Rodzeństwo' },
  { key: 'children', title: 'Dzieci' },
];

export default function PersonPanel({ personId, nodes, photos, store, onSelect, onFocus, onError }: Props) {
  const person = personId ? nodes.find(n => n.id === personId) || null : null;
  const readOnly = !!store.readOnly;
  const [mode, setMode] = useState<'view' | 'edit' | { add: RelKind }>(personId ? 'view' : 'edit');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMode(personId ? 'view' : 'edit');
    setConfirmDelete(false);
  }, [personId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onSelect(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSelect]);

  // The person was deleted by someone else while the panel was open.
  if (personId && !person) return null;

  const byId = new Map(nodes.map(n => [n.id, n]));

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e: any) {
      console.error(e);
      onError(e?.code === 'permission-denied' || e?.code === 'invalid_argument' ? 'Nie masz uprawnień do edycji tego drzewa.' : 'Nie udało się zapisać zmian. Spróbuj ponownie.');
    } finally {
      setBusy(false);
    }
  };

  const onPhoto = async (file: File | undefined) => {
    if (!file || !person) return;
    try {
      const dataUrl = await resizeImage(file, 240);
      await run(() => store.setPhoto(person.id, dataUrl));
    } catch {
      onError('Nie udało się wczytać zdjęcia.');
    }
  };

  return (
    <aside className="person-panel" aria-label="Szczegóły osoby">
      <button className="panel-close" onClick={() => onSelect(null)} aria-label="Zamknij">×</button>

      {person ? (
        <div className="panel-head">
          <button
            className="panel-avatar"
            onClick={() => fileRef.current?.click()}
            title={readOnly ? person.label : 'Kliknij, aby zmienić zdjęcie'}
            disabled={busy || readOnly}
          >
            <img src={photos[person.id] || avatarUrl(person)} alt={person.label} />
            {!readOnly && <span>Zmień zdjęcie</span>}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { onPhoto(e.target.files?.[0]); e.target.value = ''; }} />
          <div>
            <h2>{person.label}</h2>
            {person.role && <div className="muted">{person.role}</div>}
            {(person.born || person.died) && (
              <div className="muted">{[person.born && `ur. ${person.born}`, person.died && `zm. ${person.died}`].filter(Boolean).join(' · ')}</div>
            )}
            {photos[person.id] && !readOnly && (
              <button className="link-btn" onClick={() => run(() => store.setPhoto(person.id, null))}>Usuń zdjęcie</button>
            )}
          </div>
        </div>
      ) : (
        <h2 style={{ marginTop: 0 }}>Nowa osoba</h2>
      )}

      {mode === 'edit' && (
        <PersonForm
          initial={person || undefined}
          submitLabel={person ? 'Zapisz' : 'Dodaj osobę'}
          busy={busy}
          onCancel={() => (person ? setMode('view') : onSelect(null))}
          onSubmit={fields =>
            run(async () => {
              if (person) {
                await store.update(ns => updatePerson(ns, person.id, fields));
                setMode('view');
              } else {
                let newId = '';
                await store.update(ns => {
                  const r = addPerson(ns, fields as any);
                  newId = r.id;
                  return r.nodes;
                });
                onSelect(newId);
              }
            })
          }
        />
      )}

      {person && typeof mode === 'object' && (
        <AddRelationForm
          person={person}
          kind={mode.add}
          nodes={nodes}
          busy={busy}
          onCancel={() => setMode('view')}
          onSubmit={(target, coParentId) =>
            run(async () => {
              if (target.existingId) {
                const err = canLink(nodes, person.id, target.existingId, mode.add);
                if (err) return onError(err);
                await store.update(ns => addRelation(ns, person.id, target.existingId!, mode.add, coParentId));
              } else {
                await store.update(ns => addPerson(ns, target.fields!, { to: person.id, kind: mode.add, coParentId }).nodes);
              }
              setMode('view');
            })
          }
        />
      )}

      {person && mode === 'view' && (
        <>
          <div className="panel-actions">
            {!readOnly && <button onClick={() => setMode('edit')}>✏️ Edytuj dane</button>}
            <button onClick={() => onFocus(person.id)}>🎯 Pokaż drzewo tej osoby</button>
          </div>

          {person.notes && <p className="notes">{person.notes}</p>}

          {!readOnly && <h3>Dodaj</h3>}
          {!readOnly && <div className="panel-actions">
            <button onClick={() => setMode({ add: 'parent' })} disabled={person.parents.length >= MAX_PARENTS}>+ Rodzica</button>
            <button onClick={() => setMode({ add: 'spouse' })}>+ Małżonka</button>
            <button onClick={() => setMode({ add: 'child' })}>+ Dziecko</button>
            <button onClick={() => setMode({ add: 'sibling' })}>+ Rodzeństwo</button>
          </div>}

          {GROUPS.map(g => {
            const list = person[g.key];
            if (!list.length) return null;
            return (
              <div key={g.key}>
                <h3>{g.title}</h3>
                <ul className="rel-list">
                  {list.map(r => {
                    const other = byId.get(r.id);
                    if (!other) return null;
                    return (
                      <li key={r.id}>
                        <button className="rel-person" onClick={() => onSelect(other.id)}>
                          <img src={photos[other.id] || avatarUrl(other)} alt="" />
                          <span>{other.label}</span>
                        </button>
                        {!readOnly && <button
                          className="rel-remove"
                          title="Usuń to powiązanie (osoba zostaje w drzewie)"
                          disabled={busy}
                          onClick={() => run(() => store.update(ns => removeRelation(ns, person.id, other.id)))}
                        >
                          Odłącz
                        </button>}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {!readOnly && <div className="panel-danger">
            {confirmDelete ? (
              <>
                <span>Usunąć {person.label} z drzewa?</span>
                <button
                  className="danger"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await store.update(ns => deletePerson(ns, person.id));
                      if (photos[person.id]) await store.setPhoto(person.id, null);
                      onSelect(null);
                    })
                  }
                >
                  Tak, usuń
                </button>
                <button onClick={() => setConfirmDelete(false)}>Anuluj</button>
              </>
            ) : (
              <button className="link-btn danger-text" onClick={() => setConfirmDelete(true)}>Usuń osobę z drzewa</button>
            )}
          </div>}
        </>
      )}
    </aside>
  );
}

function PersonForm({
  initial,
  submitLabel,
  busy,
  onSubmit,
  onCancel,
  compact,
}: {
  initial?: Partial<Person>;
  submitLabel: string;
  busy: boolean;
  onSubmit: (f: PersonFields & { label: string; gender: Person['gender'] }) => void;
  onCancel?: () => void;
  compact?: boolean;
}) {
  const [f, setF] = useState({
    label: initial?.label || '',
    gender: (initial?.gender as string) || 'female',
    role: initial?.role || '',
    born: initial?.born || '',
    died: initial?.died || '',
    deceased: !!initial?.deceased,
    notes: initial?.notes || '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value });

  return (
    <form
      className="panel-form"
      onSubmit={e => {
        e.preventDefault();
        if (!f.label.trim()) return;
        onSubmit({ ...f, label: f.label.trim(), gender: f.gender as Person['gender'], deceased: f.deceased || !!f.died.trim() || undefined });
      }}
    >
      <label>
        Imię i nazwisko
        <input value={f.label} onChange={set('label')} required autoFocus placeholder="np. Anna Kowalska" />
      </label>
      <label>
        Płeć
        <select value={f.gender} onChange={set('gender')}>
          <option value="female">Kobieta</option>
          <option value="male">Mężczyzna</option>
        </select>
      </label>
      <label>
        Kim jest (opis)
        <input value={f.role} onChange={set('role')} placeholder="np. Babcia ze strony mamy" />
      </label>
      {!compact && (
        <>
          <div className="row">
            <label>
              Urodzenie
              <input value={f.born} onChange={set('born')} placeholder="rok lub data" />
            </label>
            <label>
              Śmierć
              <input value={f.died} onChange={set('died')} placeholder="rok lub data" />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={f.deceased} onChange={set('deceased')} /> Osoba nie żyje
          </label>
          <label>
            Notatki
            <textarea value={f.notes} onChange={set('notes')} rows={3} placeholder="Wspomnienia, miejsca, ciekawostki…" />
          </label>
        </>
      )}
      <div className="panel-actions">
        <button type="submit" className="primary" disabled={busy || !f.label.trim()}>{submitLabel}</button>
        {onCancel && <button type="button" onClick={onCancel}>Anuluj</button>}
      </div>
    </form>
  );
}

function AddRelationForm({
  person,
  kind,
  nodes,
  busy,
  onSubmit,
  onCancel,
}: {
  person: Person;
  kind: RelKind;
  nodes: Person[];
  busy: boolean;
  onSubmit: (target: { existingId?: string; fields?: PersonFields & { label: string; gender: Person['gender'] } }, coParentId?: string) => void;
  onCancel: () => void;
}) {
  const [source, setSource] = useState<'new' | 'existing'>('new');
  const [existingId, setExistingId] = useState('');
  const [coParentId, setCoParentId] = useState(person.spouses[0]?.id || '');
  const byId = new Map(nodes.map(n => [n.id, n]));

  const candidates = useMemo(
    () =>
      nodes
        .filter(n => canLink(nodes, person.id, n.id, kind) === null)
        .sort((a, b) => a.label.localeCompare(b.label, 'pl')),
    [nodes, person.id, kind],
  );

  const coParentPicker = kind === 'child' && person.spouses.length > 0 && (
    <label>
      Drugi rodzic
      <select value={coParentId} onChange={e => setCoParentId(e.target.value)}>
        {person.spouses.map(s => (
          <option key={s.id} value={s.id}>{byId.get(s.id)?.label || s.id}</option>
        ))}
        <option value="">— nieznany —</option>
      </select>
    </label>
  );

  return (
    <div className="panel-form">
      <h3 style={{ marginTop: 0 }}>Dodaj {KIND_LABEL[kind]} dla: {person.label}</h3>
      <div className="seg">
        <button className={source === 'new' ? 'on' : ''} onClick={() => setSource('new')}>Nowa osoba</button>
        <button className={source === 'existing' ? 'on' : ''} onClick={() => setSource('existing')}>Ktoś już w drzewie</button>
      </div>

      {source === 'new' ? (
        <>
          {coParentPicker}
          <PersonForm
            key={kind}
            compact
            initial={{ gender: kind === 'spouse' ? (person.gender === 'male' ? 'female' : 'male') as any : 'female' }}
            submitLabel="Dodaj"
            busy={busy}
            onCancel={onCancel}
            onSubmit={fields => onSubmit({ fields }, coParentId || undefined)}
          />
        </>
      ) : (
        <form
          onSubmit={e => {
            e.preventDefault();
            if (existingId) onSubmit({ existingId }, coParentId || undefined);
          }}
        >
          <label>
            Wybierz osobę
            <select value={existingId} onChange={e => setExistingId(e.target.value)} required>
              <option value="">— wybierz —</option>
              {candidates.map(n => (
                <option key={n.id} value={n.id}>{n.label}{n.role ? ` (${n.role})` : ''}</option>
              ))}
            </select>
          </label>
          {coParentPicker}
          <div className="panel-actions">
            <button type="submit" className="primary" disabled={busy || !existingId}>Połącz</button>
            <button type="button" onClick={onCancel}>Anuluj</button>
          </div>
        </form>
      )}
    </div>
  );
}

/** Square-crop and shrink a photo so it fits comfortably in a Firestore document. */
function resizeImage(file: File, size: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };
    img.src = url;
  });
}
