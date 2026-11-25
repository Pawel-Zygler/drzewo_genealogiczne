import { describe, it, expect, vi, afterEach } from 'vitest';
import { readFirebaseConfig } from './store';

describe('readFirebaseConfig', () => {
  afterEach(() => { vi.unstubAllEnvs(); });

  it('accepts the JS object copied from the Firebase console', () => {
    vi.stubEnv('VITE_FIREBASE_CONFIG', `const firebaseConfig = {
  apiKey: "AIzaXYZ",
  authDomain: "drzewo.firebaseapp.com",
  projectId: "drzewo",
  appId: "1:2:web:3",
};`);
    expect(readFirebaseConfig()).toMatchObject({ apiKey: 'AIzaXYZ', projectId: 'drzewo', authDomain: 'drzewo.firebaseapp.com' });
  });

  it('accepts JSON and ignores empty values', () => {
    vi.stubEnv('VITE_FIREBASE_CONFIG', '{"apiKey":"k","projectId":"p"}');
    expect(readFirebaseConfig()).toEqual({ apiKey: 'k', projectId: 'p' });
    vi.stubEnv('VITE_FIREBASE_CONFIG', '');
    expect(readFirebaseConfig()).toBeNull();
  });
});
