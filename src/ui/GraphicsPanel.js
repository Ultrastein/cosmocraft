const LS_KEY = 'cosmocraft_graphics';

export const DEFAULT_GRAPHICS = { renderDistance: 4, fog: true, quality: 'medium' };

export function loadGraphicsSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? { ...DEFAULT_GRAPHICS, ...JSON.parse(raw) } : { ...DEFAULT_GRAPHICS };
  } catch {
    return { ...DEFAULT_GRAPHICS };
  }
}

export function saveGraphicsSettings(settings) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export class GraphicsPanel {
  /**
   * @param {object} settings  Current graphics settings object (mutated on change)
   * @param {Function} onApply Called with updated settings whenever a control changes
   */
  constructor(settings, onApply) {
    this._settings = settings;
    this._onApply  = onApply;
    this._el = this._build();
  }

  getElement() { return this._el; }
  show() { this._el.style.display = 'flex'; }
  hide() { this._el.style.display = 'none'; }

  _build() {
    const el = document.createElement('div');
    el.style.cssText = 'display:none;flex-direction:column;gap:16px;';

    el.innerHTML = `
      <h3 style="color:#5af;margin:0">Gráficos</h3>

      <label style="color:#ccc;font-size:14px">
        Distancia de render: <span id="gfx-rd-val">${this._settings.renderDistance}</span> chunks
        <input id="gfx-rd" type="range" min="2" max="8" step="1"
          value="${this._settings.renderDistance}"
          style="display:block;width:240px;margin-top:4px">
      </label>

      <label style="color:#ccc;font-size:14px;display:flex;align-items:center;gap:8px">
        <input id="gfx-fog" type="checkbox" ${this._settings.fog ? 'checked' : ''}>
        Niebla
      </label>

      <div style="color:#ccc;font-size:14px">
        Calidad:
        <div style="display:flex;gap:8px;margin-top:6px">
          ${['low','medium','high'].map(q => `
            <label style="display:flex;align-items:center;gap:4px;cursor:pointer">
              <input type="radio" name="gfx-quality" value="${q}"
                ${this._settings.quality === q ? 'checked' : ''}>
              ${q === 'low' ? 'Baja' : q === 'medium' ? 'Media' : 'Alta'}
            </label>
          `).join('')}
        </div>
      </div>
    `;

    el.querySelector('#gfx-rd').addEventListener('input', e => {
      el.querySelector('#gfx-rd-val').textContent = e.target.value;
      this._settings.renderDistance = parseInt(e.target.value);
      saveGraphicsSettings(this._settings);
      this._onApply(this._settings);
    });

    el.querySelector('#gfx-fog').addEventListener('change', e => {
      this._settings.fog = e.target.checked;
      saveGraphicsSettings(this._settings);
      this._onApply(this._settings);
    });

    el.querySelectorAll('input[name="gfx-quality"]').forEach(radio => {
      radio.addEventListener('change', e => {
        if (e.target.checked) {
          this._settings.quality = e.target.value;
          saveGraphicsSettings(this._settings);
          this._onApply(this._settings);
        }
      });
    });

    return el;
  }
}
