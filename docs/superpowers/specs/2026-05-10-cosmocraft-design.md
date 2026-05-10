# CosmoCraft — Design Spec
**Date:** 2026-05-10  
**Status:** Approved

---

## Concept

CosmoCraft is a browser-based 3D voxel game (Minecraft-style) themed around science, technology, and space exploration. The player awakens on an unknown planet with a damaged suit and no resources. The goal: survive, build a scientific base, advance through a technology tree, and eventually construct a rocket to explore a procedurally generated solar system.

Target audience: all ages.

---

## Tech Stack

| Layer | Technology |
|---|---|
| 3D Rendering | Three.js |
| Dev server / bundler | Vite |
| Language | Vanilla JS (ES modules) |
| HUD / UI | HTML5 Canvas overlay + DOM |
| World generation | Custom simplex noise (JS) |

No frameworks. No TypeScript (keep it approachable).

---

## Architecture

```
cosmocraft/
  index.html
  src/
    main.js               # Entry point, game loop
    world/
      Chunk.js            # 16x16x16 voxel chunk
      WorldGen.js         # Procedural terrain generation (simplex noise)
      Planet.js           # Planet config (biome, gravity, atmosphere)
      BlockRegistry.js    # All block types and properties
    player/
      Player.js           # Position, velocity, input handling
      Physics.js          # Gravity, collision detection
      Inventory.js        # Item slots, stack management
    systems/
      Survival.js         # Oxygen, energy, temperature bars
      Crafting.js         # Recipes and crafting logic
      TechTree.js         # Technology unlocks and prerequisites
      RocketBuilder.js    # Rocket assembly and launch
    rendering/
      Renderer.js         # Three.js scene setup, camera
      ChunkMesh.js        # Greedy meshing for voxel chunks
      HUD.js              # Canvas overlay: bars, crosshair, hotbar
    ui/
      InventoryUI.js      # Inventory screen
      CraftingUI.js       # Crafting table screen
      TechTreeUI.js       # Tech tree panel
      PlanetMapUI.js      # Solar system navigation map
    utils/
      Noise.js            # Simplex noise implementation
      MathUtils.js        # Chunk coords, ray casting helpers
  assets/
    textures/             # Block face textures (pixel art)
    sounds/               # Ambient, mining, UI sounds
  public/
    index.html
```

---

## World System

### Chunks
- World divided into 16×16×16 block chunks
- Only chunks near the player are loaded (render distance: 4 chunks)
- Chunks are generated procedurally on demand and cached

### Block Types (science/space themed)
| Block | Description |
|---|---|
| Regolith | Basic planetary soil |
| Iron Ore | Common metal resource |
| Silicon Crystal | Electronics material |
| Titanium Ore | Advanced metal |
| Ice Block | Water source (ice planets) |
| Quantum Crystal | Rare, enables advanced tech |
| Steel Block | Crafted structural block |
| Solar Panel | Generates energy |
| Oxygen Generator | Creates breathable zone |
| Reactor Core | High energy output |
| Launch Pad | Required for rocket |
| Computer Block | Needed for tech tree research |

### Planets (5 total)
| Planet | Gravity | Atmosphere | Resources | Hazard |
|---|---|---|---|---|
| Terra Nova (start) | 1.0 | Thin O2 | Regolith, Iron | Mild cold at night |
| Luna Gris | 0.16 | None | Silicon, Titanium | No oxygen |
| Marte Rojo | 0.38 | CO2 | Iron, Quantum Crystal | Dust storms |
| Glacius | 0.5 | Thin | Ice, Silicon | Extreme cold |
| Vulcano | 0.8 | Toxic | Titanium, Reactor fuel | Extreme heat |

---

## Player Systems

### Movement
- WASD to move, Space to jump, mouse to look
- Gravity affected by current planet
- Pointer lock API for mouse capture

### Survival Bars
- **Oxygen** — depletes outside breathable zones; refilled by Oxygen Generator or sealed rooms
- **Energy** — suit battery; drains over time; recharged by Solar Panels or Reactors
- **Temperature** — varies by planet and day/night cycle; managed with heated/cooled suit upgrades
- If oxygen or energy hits 0: health drains rapidly

### Mining & Building
- Left click: mine block (ray cast, break after X hits)
- Right click: place block from hotbar
- Block drops as item when broken

---

## Inventory & Crafting

- 36-slot inventory (4 rows × 9 columns) + 9-slot hotbar
- Crafting table: 3×3 grid with shaped recipes (like Minecraft)
- Key recipes:
  - Iron + Regolith → Basic Pickaxe
  - Silicon + Iron → Solar Panel
  - Titanium + Computer Block → Oxygen Generator
  - Titanium + Reactor Core + Computer Block → Rocket Engine

---

## Technology Tree

Progression unlocks new recipes and abilities:

```
Level 1 — Survival Basics
  └─ Basic Tools, Suit Patch

Level 2 — Energy & Shelter
  └─ Solar Panel, Oxygen Generator, Steel Block

Level 3 — Electronics
  └─ Computer Block, Sensors, Scanner

Level 4 — Advanced Materials
  └─ Titanium Alloy, Quantum Circuits

Level 5 — Propulsion
  └─ Rocket Engine, Fuel Cell, Launch Pad

Level 6 — Deep Space
  └─ Warp Core, Space Station Module
```

Each level requires: resources + completed research (time-based or crafting a Computer Block).

---

## Rocket & Interplanetary Travel

1. Player builds rocket components on a Launch Pad (structural blocks in correct arrangement)
2. Fuels rocket with Fuel Cells
3. Opens Planet Map UI — selects destination planet
4. Launch sequence: countdown animation → screen transition → arrive at new planet
5. Each planet is a fresh procedural world seeded by planet ID

---

## Rendering Approach

- **Greedy meshing** — adjacent same-block faces merged into quads (performance)
- **Texture atlas** — all block textures in one image, UV mapped per face
- **Fog** — distance fog to hide chunk pop-in, themed as atmospheric haze
- **Day/night cycle** — directional light rotates; affects temperature and solar panel output
- **Skybox** — star field + visible planets/moon depending on location

---

## HUD Layout

```
┌─────────────────────────────────────────────┐
│ [🔋 Energy ████░░] [💨 O2 ███░░░] [🌡 Temp]  │  ← top bar
│                                             │
│               (3D world)                   │
│                   +                        │  ← crosshair
│                                             │
│ [Tech Tree]  [1][2][3][4][5][6][7][8][9]   │  ← hotbar bottom
└─────────────────────────────────────────────┘
```

---

## Phased Delivery

### Phase 1 — Playable Core
- 3D voxel world rendering (one planet, infinite terrain)
- Player movement + physics + gravity
- Mining and block placement
- Basic inventory + hotbar

### Phase 2 — Survival Systems
- Oxygen, energy, temperature bars
- Day/night cycle
- HUD overlay

### Phase 3 — Crafting & Tech Tree
- Crafting table UI
- 15+ recipes
- Tech tree with 4 levels

### Phase 4 — Multi-Planet
- 3 planets (Terra Nova, Luna Gris, Marte Rojo)
- Rocket building & launch
- Planet Map UI

### Phase 5 — Polish
- Textures (pixel art, sci-fi theme)
- Sound effects + ambient music
- Remaining planets (Glacius, Vulcano)
- Save/load (localStorage)

---

## Out of Scope (for now)
- Multiplayer
- Enemies / combat
- Mobile support
- Backend / server
