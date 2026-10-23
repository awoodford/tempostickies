import { useCallback, useRef } from 'react';

export interface DragDelta {
  /** Horizontal distance (px) travelled since the gesture started. */
  dx: number;
  /** Vertical distance (px) travelled since the gesture started. */
  dy: number;
}

export interface UsePointerDragOptions {
  onStart?: (event: React.PointerEvent) => void;
  onMove: (delta: DragDelta, event: PointerEvent) => void;
  onEnd?: (delta: DragDelta, event: PointerEvent) => void;
}

/**
 * A primitive for pointer-driven gestures (move, resize, rubber-band create).
 *
 * It listens on `window` for the duration of a single drag so the gesture keeps
 * working even when the pointer leaves the element, and it coalesces move
 * events with `requestAnimationFrame` so at most one update runs per frame.
 *
 * Returns a `pointerdown` handler to attach to the gesture's grab target.
 */
export function usePointerDrag(options: UsePointerDragOptions): (event: React.PointerEvent) => void {
  // Keep the latest callbacks in a ref so the returned handler stays stable.
  const optionsRef = useRef(options);
  optionsRef.current = options;

  return useCallback((event: React.PointerEvent) => {
    if (event.button !== 0) return; // primary button only
    event.preventDefault();

    const startX = event.clientX;
    const startY = event.clientY;
    optionsRef.current.onStart?.(event);

    let frameId: number | null = null;
    let pending: PointerEvent | null = null;

    const flush = (): void => {
      frameId = null;
      if (!pending) return;
      const current = pending;
      pending = null;
      optionsRef.current.onMove({ dx: current.clientX - startX, dy: current.clientY - startY }, current);
    };

    const handleMove = (moveEvent: PointerEvent): void => {
      pending = moveEvent;
      if (frameId === null) frameId = requestAnimationFrame(flush);
    };

    const handleUp = (upEvent: PointerEvent): void => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
      if (frameId !== null) cancelAnimationFrame(frameId);
      optionsRef.current.onEnd?.({ dx: upEvent.clientX - startX, dy: upEvent.clientY - startY }, upEvent);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
  }, []);
}
