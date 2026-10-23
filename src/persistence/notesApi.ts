import type { Note } from '../types';
import { parseNotes } from './validate';

const STORAGE_KEY = 'tempo.sticky-notes.v1';
const LATENCY_MS = 300;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Transport-agnostic persistence contract. The app depends only on this
 * interface, so the mock below could be swapped for a real `fetch`-based
 * client without touching the store or the UI.
 */
export interface NotesApi {
  fetchNotes(): Promise<Note[]>;
  saveNotes(notes: readonly Note[]): Promise<void>;
}

/**
 * A mock REST client backed by localStorage. Every call is asynchronous and
 * incurs a small artificial latency to mimic a network round-trip.
 */
class LocalStorageNotesApi implements NotesApi {
  async fetchNotes(): Promise<Note[]> {
    await wait(LATENCY_MS);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return parseNotes(JSON.parse(raw) as unknown);
    } catch {
      return [];
    }
  }

  async saveNotes(notes: readonly Note[]): Promise<void> {
    await wait(LATENCY_MS);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore unavailable/quota-exceeded storage; nothing else can be done here.
    }
  }
}

export const notesApi: NotesApi = new LocalStorageNotesApi();
