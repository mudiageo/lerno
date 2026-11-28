/**
 * Tiny local-first cache for Lerno's hybrid AI features.
 *
 * Only study notes, generated cards and aggregate counters are stored. No
 * secrets, tokens or personal identifiers are written to IndexedDB or
 * localStorage.
 */

import { browser } from '$app/env';

const DB_NAME = 'lerno-hybrid-ai';
const DB_VERSION = 1;
const COUNTER_KEY = 'lerno-hybrid-data-saved-v1';

export interface CachedNote {
  id: string;
  courseCode: string;
  topic: string;
  text: string;
  updatedAt: string;
}

export interface RevisionCard {
  front: string;
  back: string;
  hint?: string;
  topicTags?: string[];
}

export interface RevisionPack {
  id: string;
  courseCode: string;
  topic: string;
  cards: RevisionCard[];
  inferenceSource: 'on_device' | 'in_cloud' | 'unknown';
  createdAt: string;
  synced: boolean;
}

export interface DataSavedStats {
  onDeviceAnswers: number;
  cloudAnswers: number;
  bytesAvoided: number;
}

const EMPTY_STATS: DataSavedStats = {
  onDeviceAnswers: 0,
  cloudAnswers: 0,
  bytesAvoided: 0,
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!browser) {
      reject(new Error('IndexedDB is available in the browser only.'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('revisionPacks')) {
        db.createObjectStore('revisionPacks', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local cache.'));
  });
}

function fromRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Local cache request failed.'));
  });
}

function storeDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error('Local write failed.'));
    transaction.onabort = () => reject(transaction.error ?? new Error('Local write aborted.'));
  });
}

export async function cacheStudyNote(input: {
  courseCode: string;
  topic: string;
  text: string;
}): Promise<CachedNote> {
  const db = await openDb();
  const note: CachedNote = {
    id: `${input.courseCode.toUpperCase()}:${input.topic.trim().toLowerCase()}`,
    courseCode: input.courseCode.trim().toUpperCase(),
    topic: input.topic.trim(),
    text: input.text.trim(),
    updatedAt: new Date().toISOString(),
  };

  const transaction = db.transaction('notes', 'readwrite');
  transaction.objectStore('notes').put(note);
  await storeDone(transaction);
  db.close();
  return note;
}

export async function getCachedStudyNote(
  courseCode: string,
  topic: string
): Promise<CachedNote | undefined> {
  const db = await openDb();
  const id = `${courseCode.trim().toUpperCase()}:${topic.trim().toLowerCase()}`;
  const result = await fromRequest<CachedNote | undefined>(
    db.transaction('notes', 'readonly').objectStore('notes').get(id)
  );
  db.close();
  return result;
}

export async function saveRevisionPack(pack: RevisionPack): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction('revisionPacks', 'readwrite');
  transaction.objectStore('revisionPacks').put(pack);
  await storeDone(transaction);
  db.close();
}

export async function listRevisionPacks(): Promise<RevisionPack[]> {
  const db = await openDb();
  const packs = await fromRequest<RevisionPack[]>(
    db.transaction('revisionPacks', 'readonly').objectStore('revisionPacks').getAll()
  );
  db.close();
  return packs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function markRevisionPackSynced(id: string): Promise<void> {
  const db = await openDb();
  const transaction = db.transaction('revisionPacks', 'readwrite');
  const store = transaction.objectStore('revisionPacks');
  const existing = await fromRequest<RevisionPack | undefined>(store.get(id));
  if (existing) {
    store.put({ ...existing, synced: true });
  }
  await storeDone(transaction);
  db.close();
}

export function getDataSaved(): DataSavedStats {
  if (!browser) return EMPTY_STATS;
  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (!raw) return EMPTY_STATS;
    const parsed = JSON.parse(raw) as Partial<DataSavedStats>;
    return {
      onDeviceAnswers: Number(parsed.onDeviceAnswers) || 0,
      cloudAnswers: Number(parsed.cloudAnswers) || 0,
      bytesAvoided: Number(parsed.bytesAvoided) || 0,
    };
  } catch {
    return EMPTY_STATS;
  }
}

/** Counts only aggregate usage. `bytes` is an estimate, never user content. */
export function recordInference(
  source: 'on_device' | 'in_cloud' | 'unknown',
  bytes = 2_400
): DataSavedStats {
  if (!browser) return EMPTY_STATS;
  const stats = getDataSaved();
  if (source === 'on_device') {
    stats.onDeviceAnswers += 1;
    stats.bytesAvoided += bytes;
  } else if (source === 'in_cloud') {
    stats.cloudAnswers += 1;
  }
  localStorage.setItem(COUNTER_KEY, JSON.stringify(stats));
  return stats;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
