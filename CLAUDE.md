# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**TokenMirage (Mirage)** is a Figma Plugin (beta, v0.1.0) for comparing design tokens across Figma components. Written in TypeScript (backend) + vanilla JavaScript (frontend), with Portuguese documentation and comments.

## Commands

```bash
npm run build        # Full build: UI assembly + TypeScript compilation
npm run build:ui     # Rebuild ui.html only
npm run watch:ui     # Watch mode for UI source files

node dev-server.js   # Local dev server on port 3456 (CORS-enabled, for local testing)
```

No automated test suite. Load the plugin in Figma via `manifest.json` to test manually.

## Architecture

The plugin follows the standard Figma plugin two-process model:

**Backend (`code.ts` → compiled to `code.js`)**
Runs in Figma's sandbox with access to the Figma API. Handles:
- Token extraction (`extractTokens`) — reads `boundVariables` on nodes, resolves variable IDs to names/values
- Layer tree traversal (`collectLayerTree`) — recursive, lazy-filtered (only nodes with tokens)
- Diff engine (in `COMPARE` handler) — categorizes tokens as `exact | renamed | drifted | removal | addon`
- Live refresh — 3s interval polling, preserves scroll/collapse state on re-compare
- Message handlers: `GET_SELECTION`, `SEARCH_COMPONENTS`, `COMPARE`, `SET_LIVE`, `RESIZE`

**Frontend (`src/ui/` → assembled into `ui.html`)**
Runs in a sandboxed iframe with no Figma API access. Communicates with backend via `postMessage`.

Frontend files are numbered for load order:
- `01-estado-global.js` — global state (`compareSlotA/B`, `comparePendingSlot`, `compareResult`)
- `02-utilidades.js` — helpers (HTML escaping, DOM utils)
- `04-comunicacao-figma.js` — `post(msg)` + `window.onmessage` dispatcher
- `12-controlos-interface.js` — click handlers, dropdown autocomplete
- `13-inicializacao.js` — DOM ready init
- `14-compare-mode.js` (75KB) — canvas rendering, layout, interactivity (bulk of frontend logic)

**Build system (`scripts/build-ui.js`)**
Custom script — no bundler. Concatenates CSS from `src/ui/estilos/` and JS from `src/ui/js/` into `src/ui/modelo.html` template, outputting `ui.html`. Both `code.js` and `ui.html` are build artifacts (not tracked in git).

## Referência de UI (Figma)

O ficheiro de design de referência está em:
**https://www.figma.com/design/4U8p52wkahXQdItFuzljCI/Mirage?node-id=11-32**

Consultar este ficheiro ao atualizar qualquer componente de UI ou ao prototipar novas funcionalidades, para garantir consistência visual com o design definido.

## Key Conventions

**Frontend globals use `cm*` prefix** (e.g., `cmCanvas`, `cmCollapsed`, `cmHoveredId`). Internal/private functions use `_cm*`.

**postMessage protocol:**
```ts
// backend → frontend
figma.ui.postMessage({ type: 'COMPARE_READY', data: {...} })
// frontend → backend
parent.postMessage({ pluginMessage: { type: 'COMPARE', ... } }, '*')
```

**Token kind colors** (used consistently in CSS and canvas):
- `exact` → `#22c55e`, `renamed` → `#eab308`, `drifted` → `#f97316`, `removal` → `#ef4444`, `addon` → `#3b82f6`

**Layout constants** for canvas rendering are centralized in the `CMR` object in `14-compare-mode.js`.

**Task tracking** is in `TASKS.md` (Portuguese). Open items include synchronized scroll (CM-I5), expand/collapse animation (CM-I7), and component set comparison (F8.3).
