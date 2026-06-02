# CosmoCraft — Rocket Vehicle System Design
**Date:** 2026-06-02  
**Status:** Approved

---

## Overview

Players construct rockets by placing blocks in the world. When a valid rocket structure is detected (sufficient thrust vs. weight), the player can pilot the entire structure as a vehicle — all blocks move together as a fused mesh. Launch is triggered via a **Command Panel** block or by entering a **Capsule** block.

---

## 1. New Blocks

Three new blocks added to `BlockRegistry`:

| ID | Name | Color | Weight | Thrust | Hardness |
|----|------|-------|--------|--------|----------|
| 13 | Thruster | `0xff4400` | 3 | 15 | 3 |
| 14 | Command Panel | `0x00cc44` | 4 | 0 | 2 |
| 15 | Capsule | `0x44aaff` | 5 | 0 | 3 |

All existing blocks receive a `weight` property (1–5, proportional to hardness). Example:
- AIR: 0, REGOLITH: 1, STEEL_BLOCK: 3, REACTOR_CORE: 5

### Launch Condition

```
total_thrust >= total_weight * 1.2
```

Minimum viable rocket: 1 CAPSULE + 1 COMMAND_PANEL + 2 THRUSTERs  
→ weight: 5+4+6 = 15, thrust: 30 → 30 >= 18 ✅

---

## 2. Structure Detection (Flood Fill)

When the player interacts with a **Capsule** or **Command Panel** (within 3 blocks, press F):

1. BFS from the activated block in 6 cardinal directions
2. Collects all contiguous **non-natural** blocks (excludes REGOLITH, ores, ICE_BLOCK — only "buildable" blocks travel)
3. Hard limit: 512 blocks maximum
4. Validates: must contain at least 1 CAPSULE and 1 THRUSTER
5. Validates: `total_thrust >= total_weight * 1.2`
6. If invalid → HUD message: `"Faltan propulsores: necesitás X más"`
7. If valid → launch sequence begins

---

## 3. RocketVehicle (`src/systems/RocketVehicle.js`)

New class created when a valid structure is detected.

### Construction
- Remove all flood-fill blocks from the world (set to AIR)
- Build a fused `THREE.BufferGeometry` mesh from block positions (reuses color/geometry logic from `ChunkMesh`)
- Compute center of mass as pivot point
- Add mesh to scene

### Properties
```js
{
  position: { x, y, z },   // world position of pivot
  yaw: 0,                   // horizontal orientation (radians)
  velocity: { x, y, z },
  thrustPower: Number,      // total thrust from all thrusters
  totalWeight: Number,      // sum of block weights
  mesh: THREE.Group,
  blocks: Array<{localX, localY, localZ, blockId}>  // for future respawn
}
```

### Methods
- `update(dt, keys, gravityScale)` — flight physics
- `getEyePosition()` — camera follow point (center of mass + offset)
- `dispose(scene)` — remove mesh, free geometry

### Flight Physics
```
acceleration = (thrustPower / totalWeight) * inputForward
gravity = 9.8 * gravityScale (applies when Space not held)
max speed = thrustPower / totalWeight * 12
```

---

## 4. Controls (Pilot Mode)

| Key | Action |
|-----|--------|
| W / S | Forward / Backward thrust |
| A / D | Yaw left / right |
| Space | Ascend |
| Shift | Descend |
| F | Open travel UI (only at altitude ≥ 20 blocks) |
| Escape | Exit vehicle (land) — returns to normal player mode |

---

## 5. Camera (Third Person)

While piloting:
- Camera follows RocketVehicle from behind: offset `-8` on local Z axis, `+3` on Y
- Mouse look adjusts camera yaw/pitch around the vehicle
- Player `yaw` is decoupled from camera (vehicle steers, camera orbits)

---

## 6. Game Flow

```
Player builds rocket (THRUSTER + CAPSULE + COMMAND_PANEL + other blocks)
    ↓
Approach CAPSULE or COMMAND_PANEL (≤ 3 blocks) → HUD shows "F entrar/activar"
    ↓
Press F → flood fill + validation
    ↓ FAIL → HUD: "Faltan propulsores: necesitás X más"
    ↓ PASS
Remove world blocks → create RocketVehicle mesh → enter pilot mode
    ↓
Fly with WASD/Space/Shift (third-person camera)
    ↓
Altitude ≥ 20 → F opens planet travel UI
    ↓
Select planet → RocketVehicle.dispose(), player spawns walking on new planet
    ↓
ESC at any time → exit vehicle, blocks are lost (consumed by launch)
```

---

## 7. File Structure

| File | Change |
|------|--------|
| `src/world/BlockRegistry.js` | Add THRUSTER (13), COMMAND_PANEL (14), CAPSULE (15); add `weight` to all BLOCK_DATA |
| `src/systems/RocketVehicle.js` | **NEW** — flood fill, mesh build, flight physics, dispose |
| `src/systems/RocketInteraction.js` | **NEW** — interaction detection (canInteract, canActivate prompt) |
| `src/main.js` | Wire pilot mode: `_rocketVehicle`, `_pilotMode`, update loop, camera, input |
| `index.html` | Add THRUSTER, COMMAND_PANEL, CAPSULE to CREATIVE_BLOCKS list visible in index |

---

## 8. Testing

- Unit: flood fill finds all connected blocks, stops at natural blocks, respects 512 limit
- Unit: weight/thrust validation formula
- Unit: RocketVehicle.update moves position correctly given keys
- Integration: full launch → fly → travel flow in-game

---

## Out of Scope (Phase 5+)

- Rocket collision with terrain during flight
- Saving/restoring rocket structure after travel
- Multi-passenger rockets
- Rocket damage / explosion
