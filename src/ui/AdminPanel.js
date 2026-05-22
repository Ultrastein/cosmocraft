import { BLOCKS, BLOCK_DATA } from '../world/BlockRegistry.js';

const ALL_BLOCKS = Object.entries(BLOCK_DATA)
  .filter(([id]) => parseInt(id) !== BLOCKS.AIR)
  .map(([id, data]) => ({ id: parseInt(id), ...data }));

function numToHex(num) {
  return '#' + (num >>> 0).toString(16).padStart(6, '0');
}

export class AdminPanel {
  /**
   * @param {AdminSettings} adminSettings
   * @param {Function} onColorChange  Called after any color change — triggers world remesh
   */
  constructor(adminSettings, onColorChange) {
    this._admin    = adminSettings;
    this._onChange = onColorChange;
    this._el       = this._build();
  }

  getElement() { return this._el; }
  show() { this._el.style.display = 'flex'; }
  hide() { this._el.style.display = 'none'; }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = 'display:none;flex-direction:column;gap:12px;';

    const title = document.createElement('h3');
    title.style.cssText = 'color:#f84;margin:0';
    title.textContent = '🔧 Admin — Colores de bloque';
    el.appendChild(title);

    const list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:8px;max-height:300px;overflow-y:auto;';

    // Keep direct references so reset can update without fragile DOM queries
    const rows = [];

    ALL_BLOCKS.forEach(block => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:12px;';

      const swatch = document.createElement('div');
      swatch.style.cssText = 'width:20px;height:20px;border-radius:2px;border:1px solid #555;flex-shrink:0;';
      const currentColor = this._admin.getColor(block.id);
      swatch.style.background = numToHex(currentColor);

      const label = document.createElement('span');
      label.style.cssText = 'color:#ccc;font-size:13px;width:160px;';
      label.textContent = block.name;

      const picker = document.createElement('input');
      picker.type  = 'color';
      picker.value = numToHex(currentColor);
      picker.style.cssText = 'cursor:pointer;border:none;background:none;width:40px;height:28px;';

      picker.addEventListener('input', e => {
        swatch.style.background = e.target.value;
        this._admin.setColor(block.id, e.target.value);
        this._onChange();
      });

      row.appendChild(swatch);
      row.appendChild(label);
      row.appendChild(picker);
      list.appendChild(row);

      rows.push({ block, swatch, picker });
    });

    el.appendChild(list);

    const resetBtn = document.createElement('button');
    resetBtn.textContent = 'Resetear todo';
    resetBtn.style.cssText = [
      'margin-top:8px;padding:8px 16px;cursor:pointer',
      'background:#555;color:#fff;border:none;border-radius:4px;font-size:13px;align-self:flex-start',
    ].join(';');
    resetBtn.addEventListener('click', () => {
      this._admin.resetAll();
      this._onChange();
      rows.forEach(({ block, swatch, picker }) => {
        const hex = numToHex(this._admin.getColor(block.id));
        swatch.style.background = hex;
        picker.value = hex;
      });
    });
    el.appendChild(resetBtn);

    return el;
  }
}
