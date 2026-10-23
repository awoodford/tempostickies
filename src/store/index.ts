import { useCallback, useSyncExternalStore } from 'react';
import type { Note, NoteId } from '../types';
import { NotesStore } from './NotesStore';

/** Application-wide notes store singleton. */
export const store = new NotesStore();

/** Subscribe to the ordered list of note ids (re-renders on add/remove). */
export function useNoteIds(): NoteId[] {
  return useSyncExternalStore(store.subscribeIds, store.getIds, store.getIds);
}

/** Subscribe to a single note (re-renders only when that note changes). */
export function useNote(id: NoteId): Note | undefined {
  const subscribe = useCallback(
    (onStoreChange: () => void) => store.subscribeNote(id, onStoreChange),
    [id],
  );
  const getSnapshot = useCallback(() => store.getNote(id), [id]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
