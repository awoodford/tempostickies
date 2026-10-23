export interface Size {
  width: number;
  height: number;
}

export const NOTE_COLORS = ['yellow', 'green', 'blue', 'pink', 'purple'] as const;
export type NoteColor = (typeof NOTE_COLORS)[number];

export type NoteId = string;

export interface Note {
  id: NoteId;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: NoteColor;
  /** Stacking order; a note with a higher value renders in front of lower ones. */
  z: number;
}
