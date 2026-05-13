import { BLOCK_DATA } from '../world/BlockRegistry.js';

export class HUD {
  constructor(inventory) {
    this._inv = inventory;
    this._miningProgress = 0;
    this._oxygen      = 100;
    this._energy      = 100;
    this._temperature = 80;
    this._health      = 100;

    this._canvas = document.createElement('canvas');
    this._canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;';
    document.getElementById('hud').appendChild(this._canvas);
    this._ctx = this._canvas.getContext('2d');
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    this._canvas.width  = window.innerWidth;
    this._canvas.height = window.innerHeight;
  }

  setMiningProgress(p) {
    this._miningProgress = p;
  }

  setSurvivalStats(oxygen, energy, temperature, health) {
    this._oxygen      = oxygen;
    this._energy      = energy;
    this._temperature = temperature;
    this._health      = health;
  }

  draw() {
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    this._drawCrosshair(ctx, W, H);
    this._drawSurvivalBars(ctx, W, H);
    this._drawHotbar(ctx, W, H);
    if (this._miningProgress > 0) this._drawMiningBar(ctx, W, H);
  }

  _drawCrosshair(ctx, W, H) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 3;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 10, H / 2); ctx.lineTo(W / 2 + 10, H / 2);
    ctx.moveTo(W / 2, H / 2 - 10); ctx.lineTo(W / 2, H / 2 + 10);
    ctx.stroke();
    ctx.restore();
  }

  _drawHotbar(ctx, W, H) {
    const SLOT = 48, GAP = 4;
    const totalW = 9 * SLOT + 8 * GAP;
    const sx = (W - totalW) / 2;
    const sy = H - SLOT - 12;

    for (let i = 0; i < 9; i++) {
      const x = sx + i * (SLOT + GAP);
      const selected = i === this._inv.selectedSlot;
      const slot = this._inv.getHotbarSlot(i);

      ctx.fillStyle = selected ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.55)';
      ctx.strokeStyle = selected ? '#fff' : '#555';
      ctx.lineWidth = selected ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.roundRect(x, sy, SLOT, SLOT, 4);
      ctx.fill(); ctx.stroke();

      if (slot) {
        const data = BLOCK_DATA[slot.id];
        if (data) {
          const hex = '#' + data.color.toString(16).padStart(6, '0');
          ctx.fillStyle = hex;
          ctx.fillRect(x + 8, sy + 8, SLOT - 16, SLOT - 16);
        }
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'right';
        ctx.fillText(slot.count, x + SLOT - 4, sy + SLOT - 4);
      }

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(i + 1, x + SLOT / 2, sy - 3);
    }
    ctx.textAlign = 'left';
  }

  _drawMiningBar(ctx, W, H) {
    const barW = 120, barH = 8;
    const bx = (W - barW) / 2;
    const by = H / 2 + 20;
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(bx, by, barW, barH);
    ctx.fillStyle = '#f90';
    ctx.fillRect(bx, by, barW * this._miningProgress, barH);
  }

  _drawSurvivalBars(ctx, W, H) {
    ctx.save();

    const bars = [
      {
        label: 'Energy', value: this._energy, max: 100,
        colorFn: (pct) => pct > 0.6 ? '#4f4' : pct > 0.3 ? '#ff4' : '#f44',
      },
      {
        label: 'Oxygen', value: this._oxygen, max: 100,
        colorFn: (pct) => pct > 0.6 ? '#4f4' : pct > 0.3 ? '#ff4' : '#f44',
      },
      {
        label: 'Temp', value: this._temperature, max: 100,
        // Safe at 50, danger at extremes (< 20 = cold, > 80 = heat)
        colorFn: (_pct) => {
          const v = this._temperature;
          const dist = Math.abs(v - 50) / 50; // 0 = safe (50°), 1 = extreme
          return dist < 0.3 ? '#4f4' : dist < 0.6 ? '#ff4' : '#f44';
        },
      },
    ];

    const BAR_W = 160, BAR_H = 18, GAP = 24;
    const totalW = bars.length * BAR_W + (bars.length - 1) * GAP;
    let x = (W - totalW) / 2;
    const y = 16;

    for (const bar of bars) {
      const pct = Math.max(0, Math.min(1, bar.value / bar.max));

      // Determine color using per-bar color function
      const color = bar.colorFn(pct);

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

      // Value text on the right
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(bar.value), x + BAR_W - 2, y + 14 + BAR_H - 4);

      x += BAR_W + GAP;
    }

    // Health bar — only shown when player is damaged
    if (this._health < 100) {
      const pct = this._health / 100;
      const hx = (W - totalW) / 2;
      const hy = y + 14 + BAR_H + 8;

      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath();
      ctx.roundRect(hx, hy, totalW, 10, 3);
      ctx.fill();

      ctx.fillStyle = '#f44';
      ctx.beginPath();
      ctx.roundRect(hx, hy, totalW * pct, 10, 3);
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Health: ${Math.round(this._health)}`, W / 2, hy + 9);
    }

    ctx.restore();
  }
}
