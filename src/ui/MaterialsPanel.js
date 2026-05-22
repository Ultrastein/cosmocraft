import { BLOCKS, BLOCK_DATA } from '../world/BlockRegistry.js';

const ALL_BLOCKS = Object.entries(BLOCK_DATA)
  .filter(([id]) => parseInt(id) !== BLOCKS.AIR)
  .map(([id, data]) => ({ id: parseInt(id), ...data }));

export class MaterialsPanel {
  /**
   * @param {Inventory} inventory
   * @param {AdminSettings} adminSettings
   * @param {{ mode: string }} gameRef  Object with .mode property (read on each click)
   */
  constructor(inventory, adminSettings, gameRef) {
    this._inv    = inventory;
    this._admin  = adminSettings;
    this._game   = gameRef;
    this._el     = this._build();
  }

  getElement() { return this._el; }

  show() {
    this._el.style.display = 'flex';
    this._refresh();
  }

  hide() { this._el.style.display = 'none'; }

  /** Refresh swatch colors from AdminSettings (called on show) */
  _refresh() {
    const tiles = this._el.querySelectorAll('[data-block-id]');
    tiles.forEach(tile => {
      const id = parseInt(tile.dataset.blockId);
      const color = this._admin.getColor(id);
      const hex = '#' + color.toString(16).padStart(6, '0');
      tile.querySelector('.mat-swatch').style.background = hex;
    });
  }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = 'display:none;flex-direction:column;gap:12px;max-height:360px;';

    const title = document.createElement('h3');
    title.style.cssText = 'color:#5af;margin:0';
    title.textContent = 'Materiales';
    el.appendChild(title);

    const grid = document.createElement('div');
    grid.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;overflow-y:auto;max-height:300px;';

    ALL_BLOCKS.forEach(block => {
      const color = this._admin.getColor(block.id);
      const hex   = '#' + color.toString(16).padStart(6, '0');
      const tile  = document.createElement('div');
      tile.dataset.blockId = block.id;
      tile.style.cssText   = [
        'display:flex;flex-direction:column;align-items:center;gap:4px',
        'width:72px;padding:6px;border-radius:4px;cursor:pointer',
        'background:rgba(255,255,255,0.07);border:1px solid #333',
      ].join(';');
      tile.title = `Hardness: ${block.hardness}  |  Color: ${hex}`;

      tile.innerHTML = `
        <div class="mat-swatch" style="width:32px;height:32px;border-radius:2px;background:${hex}"></div>
        <span style="font-size:10px;color:#aaa;text-align:center;line-height:1.2">${block.name}</span>
      `;

      tile.addEventListener('click', () => {
        const mode = this._game.mode;
        if (mode === 'inspector') return;
        if (mode === 'creative') {
          const sel = this._inv.selectedSlot;
          this._inv.slots[sel] = { id: block.id, count: Infinity };
        } else {
          this._inv.addItem(block.id, 1);
        }
      });

      grid.appendChild(tile);
    });

    el.appendChild(grid);
    return el;
  }
}
