# Sticky Notes

A single-page sticky-notes board built with **React + TypeScript + Vite**, with all
interactions (create, move, resize, delete) implemented from scratch using Pointer
Events — no UI component libraries and no ready-made drag/resize solutions.

## Features

All four core features are implemented:

| # | Feature | How to use |
|---|---------|-----------|
| 1 | **Create** a note of a given size and position | Drag on empty board space to rubber-band a note; a plain click drops a default-sized note at the pointer |
| 2 | **Resize** a note | Drag the grip in the note's bottom-right corner |
| 3 | **Move** a note | Drag the note's header bar |
| 4 | **Delete** a note | Drag it onto the "trash" zone (bottom-right); the zone highlights when armed |

Optional bonus features, all implemented:

- **I. Text editing** — type directly into a note.
- **II. Bring to front** — pressing a note raises it above overlapping notes.
- **III + V. Persistence via an async mock REST API** — notes are loaded on startup and
  saved (debounced) through an asynchronous API that is backed by `localStorage`. The
  toolbar shows live `Loading… / Saving… / All changes saved` status.
- **IV. Colors** — pick the color for new notes in the toolbar, or recolor an existing
  note from the swatches in its header (shown on hover).

## Requirements

- **Node.js 18+** (developed on Node 22) and npm.

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (http://localhost:5173)
npm run dev

# 3. Production build (runs a strict type-check, then bundles to ./dist)
npm run build

# 4. Preview the production build locally
npm run preview
```

Other scripts:

```bash
npm run typecheck   # strict TypeScript check with no emit
```

## Browser support

Targets the latest versions of Google Chrome (Windows/Mac), Mozilla Firefox (all
platforms) and Microsoft Edge, for desktop screens of at least 1024×768. It relies on
Pointer Events, `useSyncExternalStore`, and `color-mix()`, all of which are supported in
those browsers. Light and dark color schemes are both supported automatically.

## Architecture

The application is organised in three layers with a one-directional data flow:
**UI components → store → persistence**. State lives in a small framework-agnostic
observable (`src/store/NotesStore.ts`) rather than in React. The store keeps each note as
an immutable object in a `Map` and exposes three independent subscription channels: the
list of note ids, a single note, and an "anything changed" channel. React binds to these
through `useSyncExternalStore` (`useNoteIds`, `useNote`). The key consequence is
granularity: the board subscribes only to the id list, and each `Note` subscribes only to
its own data, so dragging one note replaces just that note's object and re-renders only
that one component — the board and the other notes never re-render. Each `Note` is also
wrapped in `memo`, so the transient create-preview re-render on the board leaves existing
notes untouched.

Interactions are built on a single primitive, `usePointerDrag`. It attaches `window`-level
pointer listeners for the lifetime of one gesture (so a drag keeps working if the pointer
leaves the element) and coalesces moves with `requestAnimationFrame` so at most one update
runs per frame. Moving, resizing and rubber-band creation are all thin callbacks over this
hook. Live geometry that a gesture needs — the board's and trash zone's bounding rects, the
selected "new note" color, and the trash's armed highlight — is read on demand through a
small React context (`InteractionContext`) that exposes getters and a DOM-only class
toggle. Deliberately, none of this flows through React state during a drag, which keeps
re-renders confined to the single note being manipulated and keeps the board smooth with
many notes present.

Persistence is isolated behind a transport-agnostic `NotesApi` interface. The shipped
implementation is an asynchronous mock REST client backed by `localStorage` with simulated
latency; it could be swapped for a real `fetch` client without touching the store or the
UI. A `PersistenceController` wires the two together: it loads notes on startup, subscribes
to the store's "anything changed" channel, and writes back on a debounce, surfacing a
`SaveStatus` that the toolbar renders. Persisted data is treated as untrusted and run
through a type guard on load. TypeScript is configured in strict mode (including
`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`), and `npm run build`
type-checks the whole project before bundling.

## Project structure

```
src/
  types.ts                     # Domain types (Note, NoteColor, …)
  constants.ts                 # Sizes, thresholds, defaults
  store/
    NotesStore.ts              # Observable store with per-note subscriptions
    index.ts                   # Store singleton + React binding hooks
  persistence/
    notesApi.ts                # Async mock REST client (localStorage-backed)
    validate.ts                # Runtime guard for persisted data
    persistence.ts             # Load-on-start + debounced autosave controller
  hooks/
    usePointerDrag.ts          # Pointer-gesture primitive (rAF-batched)
  context/
    InteractionContext.ts      # Render-free access to live geometry & settings
  components/
    Board/                     # Canvas + rubber-band note creation
    Note/                      # A single note (move / resize / edit / recolor)
    Toolbar/                   # New-note color + save status + clear all
    TrashZone/                 # Drop-to-delete target
  utils/                       # geometry + id helpers
  App.tsx                      # Composition + persistence bootstrap
  main.tsx                     # Entry point
```

## Notes & trade-offs

- **No stock components / libraries**: every interactive behaviour (drag, resize,
  rubber-band create, drop-to-delete, stacking) is hand-written. The only dependencies are
  React and the Vite/TypeScript toolchain.
- **z-order** is stored as a monotonically increasing `z` per note so that bring-to-front
  mutates a single note; for a very long-lived board this could be periodically compacted.
- **Resize** is implemented from the bottom-right corner, which covers the requirement
  cleanly within the timeframe; additional handles would follow the same pattern.
