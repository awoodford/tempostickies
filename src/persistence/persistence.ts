import { useSyncExternalStore } from 'react';
import { store } from '../store';
import { notesApi, type NotesApi } from './notesApi';

export type SaveStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 500;

/**
 * Wires the store to the async API: loads notes on start, then persists them
 * (debounced) on every mutation. Exposes a small status channel so the UI can
 * reflect loading/saving state. This isolates all async I/O from the store and
 * the components.
 */
export class PersistenceController {
  private status: SaveStatus = 'idle';
  private readonly listeners = new Set<() => void>();
  private saveTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor(private readonly api: NotesApi) {}

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getStatus = (): SaveStatus => this.status;

  async start(): Promise<void> {
    if (this.unsubscribe) return; // already running
    this.setStatus('loading');
    try {
      store.hydrate(await this.api.fetchNotes());
      this.setStatus('idle');
    } catch {
      this.setStatus('error');
    }
    this.unsubscribe = store.subscribeAny(this.scheduleSave);
  }

  stop(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
    if (this.saveTimer !== null) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
  }

  private scheduleSave = (): void => {
    if (this.saveTimer !== null) clearTimeout(this.saveTimer);
    this.setStatus('saving');
    this.saveTimer = setTimeout(() => void this.flush(), SAVE_DEBOUNCE_MS);
  };

  private flush = async (): Promise<void> => {
    this.saveTimer = null;
    try {
      await this.api.saveNotes(store.getAll());
      this.setStatus('saved');
    } catch {
      this.setStatus('error');
    }
  };

  private setStatus(status: SaveStatus): void {
    this.status = status;
    this.listeners.forEach((listener) => listener());
  }
}

export const persistence = new PersistenceController(notesApi);

/** Reactive read of the current persistence status. */
export function useSaveStatus(): SaveStatus {
  return useSyncExternalStore(persistence.subscribe, persistence.getStatus, persistence.getStatus);
}
