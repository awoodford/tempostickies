import { useRef, useState, type RefObject } from 'react';
import { store, useNoteIds } from '../../store';
import { Note } from '../Note/Note';
import { usePointerDrag } from '../../hooks/usePointerDrag';
import { useInteraction } from '../../context/InteractionContext';
import { DEFAULT_NOTE_SIZE, MIN_CREATE_DRAG, MIN_NOTE_SIZE } from '../../constants';
import { clamp } from '../../utils/geometry';
import './Board.css';

interface BoardProps {
  boardRef: RefObject<HTMLDivElement>;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CreateOrigin {
  /** Pointer-down position in board-local coordinates. */
  x: number;
  y: number;
  /** Board offset in viewport coordinates, captured once per gesture. */
  rectLeft: number;
  rectTop: number;
}

/** Normalize an origin + current pointer position into a positive-size rect. */
function rectFromDrag(origin: CreateOrigin, clientX: number, clientY: number): Rect {
  const currentX = clientX - origin.rectLeft;
  const currentY = clientY - origin.rectTop;
  return {
    x: Math.min(origin.x, currentX),
    y: Math.min(origin.y, currentY),
    width: Math.abs(currentX - origin.x),
    height: Math.abs(currentY - origin.y),
  };
}

/**
 * The drawing surface. Dragging on empty space rubber-bands a new note (which
 * sets both its position and its size); a plain click drops a default-sized
 * note. Notes are rendered as children and subscribe to the store themselves,
 * so a create-preview re-render here never touches existing notes.
 */
export function Board({ boardRef }: BoardProps) {
  const ids = useNoteIds();
  const { getActiveColor } = useInteraction();
  const [preview, setPreview] = useState<Rect | null>(null);
  const originRef = useRef<CreateOrigin | null>(null);

  const startCreate = usePointerDrag({
    onStart: (event) => {
      const rect = boardRef.current?.getBoundingClientRect();
      if (!rect) return;
      const origin: CreateOrigin = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
        rectLeft: rect.left,
        rectTop: rect.top,
      };
      originRef.current = origin;
      setPreview({ x: origin.x, y: origin.y, width: 0, height: 0 });
    },
    onMove: (_delta, event) => {
      const origin = originRef.current;
      if (origin) setPreview(rectFromDrag(origin, event.clientX, event.clientY));
    },
    onEnd: (_delta, event) => {
      const origin = originRef.current;
      originRef.current = null;
      setPreview(null);
      const rect = boardRef.current?.getBoundingClientRect();
      if (!origin || !rect) return;

      let { x, y, width, height } = rectFromDrag(origin, event.clientX, event.clientY);
      if (width < MIN_CREATE_DRAG || height < MIN_CREATE_DRAG) {
        // Treated as a click: drop a default-sized note at the press point.
        width = DEFAULT_NOTE_SIZE.width;
        height = DEFAULT_NOTE_SIZE.height;
      }
      width = clamp(width, MIN_NOTE_SIZE.width, rect.width);
      height = clamp(height, MIN_NOTE_SIZE.height, rect.height);
      x = clamp(x, 0, rect.width - width);
      y = clamp(y, 0, rect.height - height);

      store.createNote({ x, y, width, height, color: getActiveColor() });
    },
  });

  const handlePointerDown = (event: React.PointerEvent): void => {
    // Only the empty background starts a creation gesture; presses on a note
    // have that note as their target and are handled by the note itself.
    if (event.target === event.currentTarget) startCreate(event);
  };

  return (
    <div ref={boardRef} className="board" onPointerDown={handlePointerDown}>
      {ids.map((id) => (
        <Note key={id} id={id} />
      ))}

      {preview && (
        <div
          className="board__preview"
          style={{ transform: `translate(${preview.x}px, ${preview.y}px)`, width: preview.width, height: preview.height }}
        />
      )}

      {ids.length === 0 && !preview && (
        <p className="board__hint">Drag anywhere to create a note — or just click</p>
      )}
    </div>
  );
}
