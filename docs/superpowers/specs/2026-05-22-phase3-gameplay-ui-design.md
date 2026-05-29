# CosmoCraft — Phase 3: Gameplay & UI Design Spec
**Date:** 2026-05-22
**Status:** Approved

---

## Overview

Phase 3 adds three game modes, a pause menu system, and four UI panels (graphics, materials, admin, inspector overlay). It also introduces persistent settings via localStorage and a per-block color customization system as a precursor to full texture support in Phase 4.

---

## Game Modes

Three modes selectable from the startup overlay and switchable via the pause menu.

| Behavior | Survival | Creative | Inspector |
|---|---|---|---|
| O2/Energy/Health depletion | ✅ | ❌ paused | ❌ paused |
| Gravity | ✅ | ❌ free flight | ❌ free flight |
| Block collision | ✅ | ✅ | ❌ noclip |
| Mining / block placement | ✅ | ✅ | ❌ |
| Inventory | ✅ limited | ✅ infinite | ❌ read-only |
| Debug overlay | ❌ | ❌ | ✅ |

### Mode Selection
- Startup overlay gains a third button: **Inspector** (alongside Survival and Creative).
- In-game mode change: pause menu → "Cambiar modo" → `window.confirm()` → game reloads in the new mode, player position preserved.

### Inspector Debug Overlay
Rendered on the HUD canvas, bottom-center, above the hotbar. Visible only in inspector mode:
```
Block: Regolith  (x:12, y:8, z:7)  |  Chunk: (0, 0, 0)  |  FPS: 60
```
- **Block**: name from `BLOCK_DATA`, or "Air" if no hit.
- **Coordinates**: world-space integer coords of the looked-at block (from raycast).
- **Chunk**: chunk coords derived from block coords (`Math.floor(coord / CHUNK_SIZE)`).
- **FPS**: rolling average over the last 60 frames (stored as `_fpsHistory` array in HUD).

### Inspector Physics: noclip
`Physics.update()` receives `options.noClip`. When `true`, collision resolution is skipped — position is updated by velocity directly with no block intersection checks. Gravity is also skipped (same path as `creativeFlight`).

---

## Pause Menu System

### DOM Structure
A `<div id="pause-menu" class="hidden">` added to `index.html`. Contains:
- `.pause-root` — main view with navigation buttons
- `.pause-panel` subpanels (graphics, materials, admin), shown one at a time

All panels use the same dark-overlay style as `#travel-ui`.

### Pause Menu Root Buttons
- **Continuar** — closes menu, re-requests pointer lock
- **Gráficos** — opens GraphicsPanel
- **Materiales** — opens MaterialsPanel
- **Admin** — opens AdminPanel (only rendered if `?admin=1` is in the URL)
- **Cambiar modo** — prompts confirmation, reloads game in selected mode

### PauseMenu Class (`src/ui/PauseMenu.js`)
```js
class PauseMenu {
  constructor(game, adminSettings)
  open()    // show root, release pointer lock
  close()   // hide all panels, request pointer lock
  isOpen()  // → bool
}
```
`main.js` replaces the existing `_travelMapOpen` flag and ESC handling with `this._pauseMenu.isOpen()`. The travel map check is merged: if travel map is open, ESC closes it; otherwise ESC toggles pause menu.

### Keyboard Handling
- **ESC**: if travel map open → close travel map; else → toggle pause menu.
- **ESC** while a subpanel is open → returns to pause root (not closes the menu).

---

## Graphics Panel (`src/ui/GraphicsPanel.js`)

Three settings, applied in real time:

| Setting | Control | Range | Default |
|---|---|---|---|
| Render Distance | Slider | 2–8 chunks | 4 |
| Fog | Toggle | on / off | on |
| Quality | Radio buttons | Low (×0.5) / Medium (×1.0) / High (×devicePixelRatio) | Medium |

### Persistence
Stored in `localStorage` under key `cosmocraft_graphics` as JSON:
```json
{ "renderDistance": 4, "fog": true, "quality": "medium" }
```
Read and applied at game startup before the first frame.

### Renderer Integration
`Renderer` gains a new method:
```js
applySettings({ renderDistance, fog, quality }) {
  // camera.far = renderDistance * CHUNK_SIZE * 16 + margin
  // scene.fog.near/far updated
  // renderer.setPixelRatio based on quality
  // RENDER_DISTANCE constant in main.js replaced by this._settings.renderDistance
}
```

---

## Materials Panel (`src/ui/MaterialsPanel.js`)

Grid of all blocks (excluding AIR), showing each block's current color (respects admin customizations) and name.

### Layout
- Tile per block: colored square (24×24px) + block name.
- Click behavior by mode:
  - **Survival**: calls `inventory.addItem(blockId, 1)` (stacks onto existing slot, or opens new slot).
  - **Creative**: sets selected hotbar slot to that block with infinite count.
  - **Inspector**: hover shows hardness and color hex; click does nothing.
- Panel is scrollable if blocks overflow.

### Color Source
Tiles read colors from `AdminSettings.getColor(blockId)` so custom colors are reflected immediately.

---

## Admin Panel (`src/ui/AdminPanel.js`)

Accessible only when `window.location.search` contains `?admin=1`.

### Layout
Scrollable list of all blocks (excluding AIR). Each row:
- Block name
- Current color swatch
- `<input type="color">` initialized to current color

### Behavior
- On color input change → `adminSettings.setColor(blockId, hexValue)` → `world.markAllDirty()` → chunks rebuild over next frames (max 4/frame, existing system).
- **Resetear todo** button → `adminSettings.resetAll()` → `world.markAllDirty()`.

---

## AdminSettings (`src/systems/AdminSettings.js`)

Manages per-block color overrides, persisted to localStorage.

```js
export class AdminSettings {
  constructor()                     // loads from localStorage
  getColor(blockId)                 // custom color or BLOCK_DATA[blockId].color (number)
  setColor(blockId, hexString)      // converts #rrggbb → number, saves
  resetAll()                        // clears all overrides, saves
  getAll()                          // returns Map<blockId, colorNumber>
}
```

**localStorage key:** `cosmocraft_admin_colors`
**Format:** `{ "1": 9340266, "7": 7368816, ... }` (blockId string → color number)

### ChunkMesh Integration
`buildChunkMesh(chunk, getBlock, getColor)` receives a third argument `getColor(blockId) → colorNumber`. When not provided, falls back to `BLOCK_DATA[id].color`. `main.js` passes `(id) => this._adminSettings.getColor(id)`.

---

## World: markAllDirty

`World` gains a `markAllDirty()` method that iterates all loaded chunks and marks each dirty. This triggers full remesh on the next frames when admin colors change.

---

## Files Changed

### New files
| File | Purpose |
|---|---|
| `src/ui/PauseMenu.js` | Pause menu root + panel navigation |
| `src/ui/GraphicsPanel.js` | Graphics settings panel |
| `src/ui/MaterialsPanel.js` | Block browser panel |
| `src/ui/AdminPanel.js` | Per-block color customization |
| `src/systems/AdminSettings.js` | Color overrides, localStorage persistence |

### Modified files
| File | Changes |
|---|---|
| `src/main.js` | Inspector mode, PauseMenu integration, AdminSettings, graphics settings applied at startup |
| `src/rendering/Renderer.js` | `applySettings()` method, pixel ratio control |
| `src/rendering/ChunkMesh.js` | `getColor` callback parameter |
| `src/rendering/HUD.js` | Inspector debug overlay, FPS counter |
| `src/player/Physics.js` | `noClip` option |
| `src/world/World.js` | `markAllDirty()` method |
| `index.html` | Inspector button, `#pause-menu` div |

---

## Out of Scope (deferred to Phase 4)
- Texture upload (PNG per block, UV mapping, texture atlas) — Phase 4
- Crafting table UI — Phase 3+ (separate spec)
- Tech tree — Phase 3+ (separate spec)
- Sound settings
- Save/load game state
