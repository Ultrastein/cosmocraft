import { BLOCK_DATA } from '../world/BlockRegistry.js';

export class HUD {
  constructor(inventory) {
    this._inv = inventory;
    this._miningProgress = 0;

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

  draw() {
    const ctx = this._ctx;
    const W = this._canvas.width;
    const H = this._canvas.height;
    ctx.clearRect(0, 0, W, H);

    this._drawCrosshair(ctx, W, H);
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
}
