import { useState, type MutableRefObject } from 'react';
import { NOTE_COLORS, type NoteColor } from '../../types';
import { useSaveStatus, type SaveStatus } from '../../persistence/persistence';
import { store } from '../../store';
import './Toolbar.css';

interface ToolbarProps {
  /** The color applied to newly created notes; read by the board at create time. */
  activeColorRef: MutableRefObject<NoteColor>;
}

const STATUS_TEXT: Record<SaveStatus, string> = {
  loading: 'Loading…',
  idle: 'Ready',
  saving: 'Saving…',
  saved: 'All changes saved',
  error: 'Save failed',
};

export function Toolbar({ activeColorRef }: ToolbarProps) {
  const [activeColor, setActiveColor] = useState<NoteColor>(activeColorRef.current);
  const status = useSaveStatus();

  const selectColor = (color: NoteColor): void => {
    activeColorRef.current = color;
    setActiveColor(color);
  };

  const clearAll = (): void => {
    if (window.confirm('Remove all notes? This cannot be undone.')) store.clearAll();
  };

  return (
    <header className="toolbar">
      <div className="toolbar__brand">Sticky Notes</div>

      <div className="toolbar__colors" role="group" aria-label="New note color">
        <span className="toolbar__caption">New note</span>
        {NOTE_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={`toolbar__swatch toolbar__swatch--${color}${color === activeColor ? ' is-active' : ''}`}
            aria-label={`New note color ${color}`}
            aria-pressed={color === activeColor}
            onClick={() => selectColor(color)}
          />
        ))}
      </div>

      <div className="toolbar__spacer" />

      <span className={`toolbar__status toolbar__status--${status}`} role="status">
        {STATUS_TEXT[status]}
      </span>
      <button type="button" className="toolbar__clear" onClick={clearAll}>
        Clear all
      </button>
    </header>
  );
}
