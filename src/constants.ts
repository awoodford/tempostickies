import type { NoteColor, Size } from './types';

export const DEFAULT_NOTE_SIZE: Size = { width: 190, height: 190 };
export const MIN_NOTE_SIZE: Size = { width: 90, height: 90 };

/**
 * Minimum drag distance (px) for a creation gesture to be treated as a sized
 * rubber-band. A shorter gesture is interpreted as a plain click and produces a
 * default-sized note at the pointer.
 */
export const MIN_CREATE_DRAG = 16;

export const DEFAULT_COLOR: NoteColor = 'yellow';
