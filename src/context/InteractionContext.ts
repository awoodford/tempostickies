import { createContext, useContext } from 'react';
import type { NoteColor } from '../types';

/**
 * Shared, render-free access to the live geometry of the board and trash zone,
 * plus the currently selected "new note" color. Values are read on demand
 * during a drag (never stored in React state) so gestures do not trigger
 * re-renders of the board or of unrelated notes.
 */
export interface InteractionContextValue {
  getBoardRect: () => DOMRect | null;
  getTrashRect: () => DOMRect | null;
  /** Toggle the trash zone's "armed" highlight without a React re-render. */
  setTrashActive: (active: boolean) => void;
  getActiveColor: () => NoteColor;
}

export const InteractionContext = createContext<InteractionContextValue | null>(null);

export function useInteraction(): InteractionContextValue {
  const value = useContext(InteractionContext);
  if (!value) throw new Error('useInteraction must be used within an InteractionContext provider');
  return value;
}
