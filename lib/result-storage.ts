'use client';

export type SavedResultRecord = {
  id: string;
  createdAt: string;
  version: string;
  input: Record<string, unknown>;
  diagnosis: any;
};

const STORAGE_KEY = 'founders-inbody-results';

function getStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function listSavedResults(): SavedResultRecord[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedResultRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function getSavedResult(id: string) {
  return listSavedResults().find((item) => item.id === id) ?? null;
}

export function saveResultRecord(record: Omit<SavedResultRecord, 'id' | 'createdAt' | 'version'>) {
  const storage = getStorage();
  if (!storage) return null;

  const saved: SavedResultRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    version: 'v1-local',
  };

  const current = listSavedResults();
  const next = [saved, ...current].slice(0, 20);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
  return saved;
}

export function deleteSavedResult(id: string) {
  const storage = getStorage();
  if (!storage) return;

  const next = listSavedResults().filter((item) => item.id !== id);
  storage.setItem(STORAGE_KEY, JSON.stringify(next));
}
