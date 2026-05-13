# CosmoCraft Phase 2 — Survival Systems Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add survival mechanics to the playable CosmoCraft core. The player must now monitor oxygen, energy, and temperature to stay alive. A day/night cycle drives temperature changes and affects solar energy. The HUD gains three colored survival bars at the top of the screen.

**Builds on Phase 1:** All Phase 1 systems exist and work. This phase adds new systems and extends existing ones without rewriting Phase 1 code.

**Branch:** `phase2-survival-systems`

---

## File Map

| File | Responsibility | Status |
|---|---|---|
| `src/systems/Survival.js` | Tracks oxygen, energy, temperature, health; depletion logic | **Create** |
| `src/rendering/Renderer.js` | Extend with day/night cycle (`updateDayNight`, `getDayProgress`) | **Extend** |
| `src/rendering/HUD.js` | Extend with survival bars at top (`setSurvivalStats`) | **Extend** |
| `src/main.js` | Wire Survival into game loop; update HUD with survival stats | **Extend** |
| `tests/systems/Survival.test.js` | Tests for survival system logic | **Create** |

---

## Task 1: Survival System

**Files:**
- Create: `src/systems/Survival.js`
- Create: `tests/systems/Survival.test.js`

### What it does

Tracks four survival values for the player on Terra Nova (Phase 2 hardcodes one planet):

| Stat | Range | Normal depletion | Critical threshold |
|---|---|---|---|
| Oxygen | 0–100 | -2/sec (thin O2 atmosphere) | < 20 |
| Energy | 0–100 | -1.5/sec (suit battery drain) | < 20 |
| Temperature | 0–100 | Oscillates with day/night | < 20 or > 80 |
| Health | 0–100 | -5/sec when O2 or energy = 0 | 0 = dead (just stops at 0 for now) |

Temperature formula:
- `temperature = 50 + 30 * Math.cos(dayProgress * 2 * Math.PI)`
- Hottest at noon (dayProgress = 0), coldest at midnight (dayProgress = 0.5)
- Clamped to [0, 100]

No damage from temperature in Phase 2 (just display it). Health only drains from oxygen or energy hitting zero.

### API

```js
export class Survival {
  constructor()
  update(dt, dayProgress)     // called every frame; dayProgress 0..1
  refillOxygen(amount)        // called by oxygen generators (future)
  refillEnergy(amount)        // called by solar panels (future)
  getOxygen()    // 0..100
  getEnergy()    // 0..100
  getTemperature() // 0..100
  getHealth()    // 0..100
  isAlive()      // health > 0
}
```

### Tests

```js
// tests/systems/Survival.test.js
import { describe, it, expect } from 'vitest';
import { Survival } from '../../src/systems/Survival.js';

describe('Survival', () => {
  it('starts at full oxygen, energy, health; temperature at midpoint', () => {
    const s = new Survival();
    expect(s.getOxygen()).toBe(100);
    expect(s.getEnergy()).toBe(100);
    expect(s.getHealth()).toBe(100);
    // temperature at dayProgress=0 should be 80 (50 + 30*cos(0))
  });

  it('oxygen depletes over time', () => {
    const s = new Survival();
    s.update(10, 0); // 10 seconds, noon
    expect(s.getOxygen()).toBeLessThan(100);
    expect(s.getOxygen()).toBeGreaterThanOrEqual(0);
  });

  it('energy depletes over time', () => {
    const s = new Survival();
    s.update(10, 0);
    expect(s.getEnergy()).toBeLessThan(100);
    expect(s.getEnergy()).toBeGreaterThanOrEqual(0);
  });

  it('oxygen never goes below 0', () => {
    const s = new Survival();
    s.update(200, 0); // deplete way past 0
    expect(s.getOxygen()).toBe(0);
  });

  it('energy never goes below 0', () => {
    const s = new Survival();
    s.update(200, 0);
    expect(s.getEnergy()).toBe(0);
  });

  it('health drains when oxygen is 0', () => {
    const s = new Survival();
    s.update(200, 0); // drain oxygen to 0
    const healthAfterOxygenDepleted = s.getHealth();
    expect(healthAfterOxygenDepleted).toBeLessThan(100);
  });

  it('refillOxygen increases oxygen up to 100', () => {
    const s = new Survival();
    s.update(10, 0); // deplete a bit
    const before = s.getOxygen();
    s.refillOxygen(50);
    expect(s.getOxygen()).toBeGreaterThan(before);
    expect(s.getOxygen()).toBeLessThanOrEqual(100);
  });

  it('refillEnergy increases energy up to 100', () => {
    const s = new Survival();
    s.update(10, 0);
    const before = s.getEnergy();
    s.refillEnergy(50);
    expect(s.getEnergy()).toBeGreaterThan(before);
    expect(s.getEnergy()).toBeLessThanOrEqual(100);
  });

  it('temperature is based on dayProgress (cosine curve)', () => {
    const s = new Survival();
    s.update(0.001, 0);   // near noon
    const noonTemp = s.getTemperature();
    s.update(0.001, 0.5); // near midnight
    const midnightTemp = s.getTemperature();
    // Noon should be warmer than midnight
    expect(noonTemp).toBeGreaterThan(midnightTemp);
  });

  it('isAlive returns false when health reaches 0', () => {
    const s = new Survival();
    // Drain everything for a very long time
    s.update(1000, 0);
    expect(s.isAlive()).toBe(false);
  });
});
```

### Implementation

```js
// src/systems/Survival.js
const OXYGEN_DEPLETION = 2;    // per second
const ENERGY_DEPLETION = 1.5;  // per second
const HEALTH_DRAIN     = 5;    // per second when O2 or energy = 0

export class Survival {
  constructor() {
    this._oxygen      = 100;
    this._energy      = 100;
    this._temperature = 80;   // set on first update
    this._health      = 100;
  }

  update(dt, dayProgress) {
    this._oxygen      = Math.max(0, this._oxygen - OXYGEN_DEPLETION * dt);
    this._energy      = Math.max(0, this._energy - ENERGY_DEPLETION * dt);
    this._temperature = Math.round(50 + 30 * Math.cos(dayProgress * 2 * Math.PI));
    this._temperature = Math.max(0, Math.min(100, this._temperature));

    if (this._oxygen === 0 || this._energy === 0) {
      this._health = Math.max(0, this._health - HEALTH_DRAIN * dt);
    }
  }

  refillOxygen(amount)  { this._oxygen = Math.min(100, this._oxygen + amount); }
  refillEnergy(amount)  { this._energy = Math.min(100, this._energy + amount); }
  getOxygen()           { return this._oxygen; }
  getEnergy()           { return this._energy; }
  getTemperature()      { return this._temperature; }
  getHealth()           { return this._health; }
  isAlive()             { return this._health > 0; }
}
```

### Steps

- [ ] Create `tests/systems/Survival.test.js` with the tests above
- [ ] Run `npm test` — verify it fails (module not found)
- [ ] Create `src/systems/Survival.js` with the implementation above
- [ ] Run `npm test` — verify all 10 survival tests pass
- [ ] Commit: `feat: Survival system with oxygen, energy, temperature, health`

---

## Task 2: Day/Night Cycle

**Files:**
- Extend: `src/rendering/Renderer.js`

### What it adds

A `updateDayNight(dt)` method that advances an internal day timer and adjusts scene lighting accordingly:

- Full day = 600 seconds (10 minutes real time)
- Sun orbits the world on the X-Z plane, tilted slightly
- At noon: warm bright light (0xffe0b0, intensity 1.4), sky slightly lighter
- At dusk/dawn: orange tones (0xff8040, intensity 0.6)
- At midnight: very dim cool light (0x2030ff, intensity 0.15), black sky

A `getDayProgress()` method returns current day fraction 0..1 (0 = noon, 0.5 = midnight).

### API additions to Renderer

```js
updateDayNight(dt)   // advances day timer, updates sun position + color
getDayProgress()     // returns 0..1 (0 = noon, 0.5 = midnight)
```

### Implementation

Add to `Renderer` class in `src/rendering/Renderer.js`:

```js
// In constructor, replace static sun line with:
this.sun = new THREE.DirectionalLight(0xffe0b0, 1.2);
this.sun.position.set(60, 120, 40);
this.scene.add(this.sun);

this._dayTime    = 0;      // 0..1
this._dayLength  = 600;    // seconds for full cycle
this._ambientLight = new THREE.AmbientLight(0x302050, 0.6);
this.scene.add(this._ambientLight);
// (remove old scene.add(new THREE.AmbientLight(...)) line)
```

```js
// New methods:
getDayProgress() {
  return this._dayTime;
}

updateDayNight(dt) {
  this._dayTime = (this._dayTime + dt / this._dayLength) % 1;

  // Angle: 0 = noon (sun overhead), 0.5 = midnight
  const angle = this._dayTime * Math.PI * 2;
  const sunX = Math.sin(angle) * 200;
  const sunY = Math.cos(angle) * 200;
  this.sun.position.set(sunX, sunY, 40);

  // Intensity: 1.4 at noon, 0.1 at midnight
  const t = Math.cos(angle); // +1 at noon, -1 at midnight
  const intensity = 0.75 + t * 0.65;
  this.sun.intensity = Math.max(0.1, intensity);

  // Color temperature: warm at noon, cool/blue at night
  const warmth = Math.max(0, t); // 0..1, 0 at night
  const r = Math.round(0x70 + warmth * (0xff - 0x70));
  const g = Math.round(0x60 + warmth * (0xe0 - 0x60));
  const b = Math.round(0x80 + warmth * (0xb0 - 0x80));
  this.sun.color.setRGB(r / 255, g / 255, b / 255);

  // Ambient: darker at night
  const ambientI = 0.15 + warmth * 0.45;
  this._ambientLight.intensity = ambientI;

  // Sky/fog color: near-black at night, dark-blue-purple at day
  const skyR = Math.round(4  + warmth * 8);
  const skyG = Math.round(4  + warmth * 8);
  const skyB = Math.round(15 + warmth * 20);
  const skyColor = new THREE.Color(skyR / 255, skyG / 255, skyB / 255);
  this.scene.background = skyColor;
  this.scene.fog.color  = skyColor;
}
```

### Steps

- [ ] Open `src/rendering/Renderer.js`
- [ ] Store the ambient light as `this._ambientLight` (instead of anonymous `scene.add`)
- [ ] Add `this._dayTime = 0` and `this._dayLength = 600` to constructor
- [ ] Add `getDayProgress()` method
- [ ] Add `updateDayNight(dt)` method
- [ ] Commit: `feat: day/night cycle with sun orbit and dynamic lighting`

---

## Task 3: HUD Survival Bars

**Files:**
- Extend: `src/rendering/HUD.js`

### What it adds

A `setSurvivalStats(oxygen, energy, temperature, health)` method and a `_drawSurvivalBars()` private method.

The bars appear at the top of the screen, horizontally centered:

```
[🔋 ████████░░  80%]  [💨 ██████░░░░  60%]  [🌡 █████████░  90°]
```

Layout:
- Three bars, each 160px wide, 18px tall, with 20px gap between
- Icons and labels above each bar
- Colors: green (>60%), yellow (30–60%), red (<30%)
- Health bar shown below if health < 100 (red bar, full width)

### API additions to HUD

```js
setSurvivalStats(oxygen, energy, temperature, health)
// oxygen, energy, health: 0..100
// temperature: 0..100 (50 = safe, 20 = cold danger, 80 = heat danger)
```

### Implementation

Add to `HUD` class in `src/rendering/HUD.js`:

```js
// In constructor, add:
this._oxygen = 100;
this._energy = 100;
this._temperature = 80;
this._health = 100;
```

```js
setSurvivalStats(oxygen, energy, temperature, health) {
  this._oxygen      = oxygen;
  this._energy      = energy;
  this._temperature = temperature;
  this._health      = health;
}
```

In `draw()`, add call after `_drawCrosshair`:
```js
this._drawSurvivalBars(ctx, W, H);
```

```js
_drawSurvivalBars(ctx, W, H) {
  const bars = [
    { label: '⚡ Energy',  value: this._energy,      max: 100 },
    { label: '💨 Oxygen',  value: this._oxygen,      max: 100 },
    { label: '🌡 Temp',    value: this._temperature, max: 100 },
  ];

  const BAR_W = 160, BAR_H = 18, GAP = 24;
  const totalW = bars.length * BAR_W + (bars.length - 1) * GAP;
  let x = (W - totalW) / 2;
  const y = 16;

  for (const bar of bars) {
    const pct = Math.max(0, Math.min(1, bar.value / bar.max));

    // Determine color
    let color;
    if (pct > 0.6)      color = '#4f4';
    else if (pct > 0.3) color = '#ff4';
    else                color = '#f44';

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '11px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(bar.label, x, y + 11);

    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(x, y + 14, BAR_W, BAR_H, 3);
    ctx.fill();

    // Fill
    if (pct > 0) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x, y + 14, BAR_W * pct, BAR_H, 3);
      ctx.fill();
    }

    // Value text
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'right';
    ctx.fillText(Math.round(bar.value), x + BAR_W - 2, y + 14 + BAR_H - 4);

    x += BAR_W + GAP;
  }

  // Health bar (only when damaged)
  if (this._health < 100) {
    const pct = this._health / 100;
    const hx = (W - 300) / 2;
    const hy = y + 14 + BAR_H + 8;

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(hx, hy, 300, 10, 3);
    ctx.fill();

    ctx.fillStyle = '#f44';
    ctx.beginPath();
    ctx.roundRect(hx, hy, 300 * pct, 10, 3);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`❤ ${Math.round(this._health)}`, W / 2, hy + 9);
  }

  ctx.textAlign = 'left';
}
```

### Steps

- [ ] Open `src/rendering/HUD.js`
- [ ] Add `_oxygen`, `_energy`, `_temperature`, `_health` fields to constructor (all starting at 100)
- [ ] Add `setSurvivalStats(oxygen, energy, temperature, health)` method
- [ ] Add `_drawSurvivalBars(ctx, W, H)` private method
- [ ] Call `this._drawSurvivalBars(ctx, W, H)` inside `draw()` after crosshair
- [ ] Commit: `feat: HUD survival bars (oxygen, energy, temperature, health)`

---

## Task 4: Wire Survival Into Game Loop

**Files:**
- Extend: `src/main.js`

### What changes

1. Import `Survival` from `./systems/Survival.js`
2. Create `this._survival = new Survival()` in Game constructor
3. In `_loop(dt)`:
   - Call `this._renderer.updateDayNight(dt)` 
   - Call `this._survival.update(dt, this._renderer.getDayProgress())`
   - Call `this._hud.setSurvivalStats(survival.getOxygen(), survival.getEnergy(), survival.getTemperature(), survival.getHealth())`
4. Add low-oxygen / low-energy warning (just visual — bars turn red)

No new tests needed — survival logic is tested in Task 1, renderer and HUD are visual-only.

The implementer should:
- Read the current `src/main.js` to understand the structure
- Make minimal changes: add import, add survival in constructor, add 3 lines in `_loop`
- Not rewrite or restructure existing code

### Steps

- [ ] Open `src/main.js`
- [ ] Add import: `import { Survival } from './systems/Survival.js';`
- [ ] In constructor: `this._survival = new Survival();`
- [ ] In `_loop(dt)`, after `this._player.update(dt)`, add:
  ```js
  this._renderer.updateDayNight(dt);
  this._survival.update(dt, this._renderer.getDayProgress());
  this._hud.setSurvivalStats(
    this._survival.getOxygen(),
    this._survival.getEnergy(),
    this._survival.getTemperature(),
    this._survival.getHealth()
  );
  ```
- [ ] Run `npm test` — all tests still pass
- [ ] Commit: `feat: wire survival system into game loop`

---

## Visual Acceptance Criteria

After all 4 tasks complete, the game should show:

1. **Survival bars** at the top of the HUD: Energy, Oxygen, and Temperature, in green/yellow/red depending on value
2. **Bars deplete over time** — oxygen drops first (2/sec), energy slower (1.5/sec)
3. **Temperature oscillates** — slowly cycles between hot (day) and cold (night) based on sun position
4. **Day/night cycle** — sky darkens and brightens over ~10 minutes; sun visibly moves
5. **Health bar** appears (red) when oxygen or energy hits 0
6. **All Phase 1 features still work** — movement, mining, placing, hotbar unchanged

---

## Self-Review Checklist

- [ ] Survival system with oxygen, energy, temperature, health
- [ ] Tests for Survival: 10 tests passing
- [ ] Day/night cycle in Renderer (sun orbits, light changes)
- [ ] HUD survival bars (3 bars at top, color coded)
- [ ] Health bar (shown when health < 100)
- [ ] All wired in main.js game loop
- [ ] All 30+ tests still passing (no regressions)
