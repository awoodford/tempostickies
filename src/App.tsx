import { useEffect, useMemo, useRef } from 'react';
import { Board } from './components/Board/Board';
import { Toolbar } from './components/Toolbar/Toolbar';
import { TrashZone } from './components/TrashZone/TrashZone';
import { InteractionContext, type InteractionContextValue } from './context/InteractionContext';
import { persistence } from './persistence/persistence';
import { DEFAULT_COLOR } from './constants';
import type { NoteColor } from './types';
import './App.css';

export function App() {
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const activeColorRef = useRef<NoteColor>(DEFAULT_COLOR);

  const interaction = useMemo<InteractionContextValue>(
    () => ({
      getBoardRect: () => boardRef.current?.getBoundingClientRect() ?? null,
      getTrashRect: () => trashRef.current?.getBoundingClientRect() ?? null,
      setTrashActive: (active) => {
        trashRef.current?.classList.toggle('trash--active', active);
      },
      getActiveColor: () => activeColorRef.current,
    }),
    [],
  );

  useEffect(() => {
    void persistence.start();
    return () => persistence.stop();
  }, []);

  return (
    <InteractionContext.Provider value={interaction}>
      <div className="app">
        <Toolbar activeColorRef={activeColorRef} />
        <main className="app__workspace">
          <Board boardRef={boardRef} />
          <TrashZone trashRef={trashRef} />
        </main>
      </div>
    </InteractionContext.Provider>
  );
}
