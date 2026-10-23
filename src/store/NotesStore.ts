import type { Note, NoteColor, NoteId } from '../types';
import { createId } from '../utils/id';

type Listener = () => void;

export interface CreateNoteInput {
  x: number;
  y: number;
  width: number;
  height: number;
  color: NoteColor;
}

/**
 * A minimal observable store for notes.
 *
 * It exposes three independent subscription channels so that React components
 * can subscribe at the narrowest useful granularity:
 *  - `subscribeIds`  — the set of note ids changed (a note was added/removed).
 *  - `subscribeNote` — a single note's data changed.
 *  - `subscribeAny`  — any mutation happened (used by the persistence layer).
 *
 * Because each note is stored as an immutable object that is replaced on every
 * change, dragging one note only notifies that note's listeners, so only that
 * note re-renders — the board and the other notes stay untouched.
 */
export class NotesStore {
  private notes = new Map<NoteId, Note>();
  private ids: NoteId[] = [];
  private nextZ = 1;

  private idsListeners = new Set<Listener>();
  private noteListeners = new Map<NoteId, Set<Listener>>();
  private anyListeners = new Set<Listener>();

  // --- id-list channel (consumed by the board) ---

  subscribeIds = (listener: Listener): (() => void) => {
    this.idsListeners.add(listener);
    return () => this.idsListeners.delete(listener);
  };

  getIds = (): NoteId[] => this.ids;

  // --- single-note channel (consumed by each Note) ---

  subscribeNote = (id: NoteId, listener: Listener): (() => void) => {
    let set = this.noteListeners.get(id);
    if (!set) {
      set = new Set();
      this.noteListeners.set(id, set);
    }
    set.add(listener);
    return () => {
      const current = this.noteListeners.get(id);
      if (!current) return;
      current.delete(listener);
      if (current.size === 0) this.noteListeners.delete(id);
    };
  };

  getNote = (id: NoteId): Note | undefined => this.notes.get(id);

  // --- "anything changed" channel (consumed by persistence) ---

  subscribeAny = (listener: Listener): (() => void) => {
    this.anyListeners.add(listener);
    return () => this.anyListeners.delete(listener);
  };

  getAll = (): Note[] => {
    const result: Note[] = [];
    for (const id of this.ids) {
      const note = this.notes.get(id);
      if (note) result.push(note);
    }
    return result;
  };

  // --- mutations ---

  createNote = (input: CreateNoteInput): NoteId => {
    const id = createId();
    const note: Note = {
      id,
      x: input.x,
      y: input.y,
      width: input.width,
      height: input.height,
      text: '',
      color: input.color,
      z: this.nextZ++,
    };
    this.notes.set(id, note);
    this.ids = [...this.ids, id];
    this.emitIds();
    this.emitAny();
    return id;
  };

  moveNote = (id: NoteId, x: number, y: number): void => this.patch(id, { x, y });

  resizeNote = (id: NoteId, width: number, height: number): void =>
    this.patch(id, { width, height });

  setText = (id: NoteId, text: string): void => this.patch(id, { text });

  setColor = (id: NoteId, color: NoteColor): void => this.patch(id, { color });

  bringToFront = (id: NoteId): void => {
    const note = this.notes.get(id);
    if (!note || note.z === this.nextZ - 1) return;
    this.patch(id, { z: this.nextZ++ });
  };

  removeNote = (id: NoteId): void => {
    if (!this.notes.delete(id)) return;
    this.ids = this.ids.filter((candidate) => candidate !== id);
    this.emitIds();
    this.emitAny();
  };

  clearAll = (): void => {
    if (this.ids.length === 0) return;
    this.notes.clear();
    this.ids = [];
    this.emitIds();
    this.emitAny();
  };

  /** Replace the whole store from persisted data. Does not trigger a save. */
  hydrate = (notes: readonly Note[]): void => {
    this.notes.clear();
    let maxZ = 0;
    const ids: NoteId[] = [];
    for (const note of notes) {
      this.notes.set(note.id, note);
      ids.push(note.id);
      if (note.z > maxZ) maxZ = note.z;
    }
    this.ids = ids;
    this.nextZ = maxZ + 1;
    this.emitIds();
  };

  private patch = (id: NoteId, patch: Partial<Note>): void => {
    const previous = this.notes.get(id);
    if (!previous) return;
    this.notes.set(id, { ...previous, ...patch });
    this.emitNote(id);
    this.emitAny();
  };

  private emitIds(): void {
    this.idsListeners.forEach((listener) => listener());
  }

  private emitNote(id: NoteId): void {
    this.noteListeners.get(id)?.forEach((listener) => listener());
  }

  private emitAny(): void {
    this.anyListeners.forEach((listener) => listener());
  }
}
