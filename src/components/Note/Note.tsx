import { memo, useRef } from 'react';
import { store, useNote } from '../../store';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useInteraction } from '../../context/InteractionContext';
import { NOTE_COLORS, type NoteId } from '../../types';
import { clamp, rectsIntersect, type RectBounds } from '../../utils/geometry';
import { MIN_NOTE_SIZE } from '../../constants';
import './Note.css';

interface NoteProps {
  id: NoteId;
}

interface DragOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A single sticky note. Wrapped in `memo` and backed by a per-note store
 * subscription, so it re-renders only when its own data changes — dragging one
 * note never re-renders the others.
 */
export const Note = memo(function Note({ id }: NoteProps) {
  const note = useNote(id);
  const { getBoardRect, getTrashRect, setTrashActive } = useInteraction();
  const originRef = useRef<DragOrigin | null>(null);

  const captureOrigin = (): void => {
    const current = store.getNote(id);
    if (current) {
      originRef.current = {
        x: current.x,
        y: current.y,
        width: current.width,
        height: current.height,
      };
    }
  };

  // The note is "over the bin" when the note's own box overlaps the trash box,
  // not merely when the pointer does.
  const overlapsTrash = (board: DOMRect, x: number, y: number, origin: DragOrigin): boolean => {
    const trash = getTrashRect();
    if (!trash) return false;
    const noteRect: RectBounds = {
      left: board.left + x,
      top: board.top + y,
      right: board.left + x + origin.width,
      bottom: board.top + y + origin.height,
    };
    return rectsIntersect(noteRect, trash);
  };

  const handleMove = usePointerDrag({
    onStart: captureOrigin,
    onMove: (delta) => {
      const origin = originRef.current;
      if (!origin) return;
      const board = getBoardRect();
      let x = origin.x + delta.dx;
      let y = origin.y + delta.dy;
      if (board) {
        x = clamp(x, 0, board.width - origin.width);
        y = clamp(y, 0, board.height - origin.height);
      }
      store.moveNote(id, x, y);
      setTrashActive(board !== null && overlapsTrash(board, x, y, origin));
    },
    onEnd: (delta) => {
      const origin = originRef.current;
      originRef.current = null;
      setTrashActive(false);
      if (!origin) return;
      const board = getBoardRect();
      if (!board) return;
      const x = clamp(origin.x + delta.dx, 0, board.width - origin.width);
      const y = clamp(origin.y + delta.dy, 0, board.height - origin.height);
      if (overlapsTrash(board, x, y, origin)) store.removeNote(id);
    },
  });

  const handleResize = usePointerDrag({
    onStart: captureOrigin,
    onMove: (delta) => {
      const origin = originRef.current;
      if (!origin) return;
      const board = getBoardRect();
      const maxWidth = board ? board.width - origin.x : Number.POSITIVE_INFINITY;
      const maxHeight = board ? board.height - origin.y : Number.POSITIVE_INFINITY;
      const width = clamp(origin.width + delta.dx, MIN_NOTE_SIZE.width, maxWidth);
      const height = clamp(origin.height + delta.dy, MIN_NOTE_SIZE.height, maxHeight);
      store.resizeNote(id, width, height);
    },
    onEnd: () => {
      originRef.current = null;
    },
  });

  if (!note) return null;

  return (
    <div
      className={`note note--${note.color}`}
      style={{ transform: `translate(${note.x}px, ${note.y}px)`, width: note.width, height: note.height, zIndex: note.z }}
      // Any press anywhere on the note raises it above overlapping notes.
      onPointerDownCapture={() => store.bringToFront(id)}
      role="group"
      aria-label="Sticky note"
    >
      <div className="note__header" onPointerDown={handleMove}>
        <div className="note__swatches">
          {NOTE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`note__swatch note__swatch--${color}${color === note.color ? ' is-active' : ''}`}
              aria-label={`Change color to ${color}`}
              aria-pressed={color === note.color}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => store.setColor(id, color)}
            />
          ))}
        </div>
      </div>

      <textarea
        className="note__text"
        value={note.text}
        placeholder="Type a note…"
        aria-label="Note text"
        onPointerDown={(event) => event.stopPropagation()}
        onChange={(event) => store.setText(id, event.target.value)}
      />

      <span
        className="note__resize"
        onPointerDown={handleResize}
        role="separator"
        aria-label="Resize note"
      />
    </div>
  );
});
