import { BLOCK_DATA } from '../world/BlockRegistry.js';

const LS_KEY = 'cosmocraft_admin_colors';

export class AdminSettings {
  constructor() {
    this._colors = this._load();
  }

  /** Returns the custom color (number) or the BLOCK_DATA default. */
  getColor(blockId) {
    const custom = this._colors[String(blockId)];
    return custom !== undefined ? custom : (BLOCK_DATA[blockId]?.color ?? 0x888888);
  }

  /** hexString: '#rrggbb' */
  setColor(blockId, hexString) {
    const val = parseInt(hexString.replace(/^#/, ''), 16);
    if (Number.isNaN(val)) return;
    this._colors[String(blockId)] = val;
    this._save();
  }

  resetAll() {
    this._colors = {};
    try {
      localStorage.removeItem(LS_KEY);
    } catch { /* ignore */ }
  }

  _load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _save() {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this._colors));
    } catch { /* ignore quota errors */ }
  }
}
