import { NOTE_COLORS, type Note, type NoteColor } from '../types';

function isNoteColor(value: unknown): value is NoteColor {
  return typeof value === 'string' && (NOTE_COLORS as readonly string[]).includes(value);
}

function isNote(value: unknown): value is Note {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.x === 'number' &&
    typeof candidate.y === 'number' &&
    typeof candidate.width === 'number' &&
    typeof candidate.height === 'number' &&
    typeof candidate.text === 'string' &&
    typeof candidate.z === 'number' &&
    isNoteColor(candidate.color)
  );
}

/** Narrow untrusted persisted data to a list of valid notes, dropping anything malformed. */
export function parseNotes(raw: unknown): Note[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isNote);
}
