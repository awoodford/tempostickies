import type { RefObject } from 'react';
import './TrashZone.css';

interface TrashZoneProps {
  trashRef: RefObject<HTMLDivElement>;
}

/**
 * Drop target for deletion. Its "armed" highlight is toggled directly on the
 * DOM node (via the interaction context) while a note is dragged over it, so
 * hovering never re-renders React.
 */
export function TrashZone({ trashRef }: TrashZoneProps) {
  return (
    <div ref={trashRef} className="trash" aria-label="Trash. Drag a note here to delete it.">
      <svg className="trash__icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M4 7h16M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1zM6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="trash__label">Drop here to delete</span>
    </div>
  );
}
