import { GraphicsPanel, loadGraphicsSettings } from './GraphicsPanel.js';
import { MaterialsPanel } from './MaterialsPanel.js';
import { AdminPanel } from './AdminPanel.js';

function makeBtn(text, bg = '#28f') {
  const b = document.createElement('button');
  b.textContent = text;
  b.style.cssText = [
    'padding:10px 24px;font-size:16px;cursor:pointer',
    `background:${bg};color:#fff;border:none;border-radius:4px;min-width:200px`,
  ].join(';');
  return b;
}

export class PauseMenu {
  /**
   * @param {object} game  Must expose: mode, _inventory, _world, _renderer, _requestLock(), setMode(m)
   * @param {AdminSettings} adminSettings
   */
  constructor(game, adminSettings) {
    this._game          = game;
    this._adminSettings = adminSettings;
    this._open          = false;
    this._el            = document.getElementById('pause-menu');
    this._graphicsSettings = loadGraphicsSettings();

    this._graphicsPanel  = new GraphicsPanel(this._graphicsSettings, s => {
      game._renderer.applySettings(s);
    });
    this._materialsPanel = new MaterialsPanel(game._inventory, adminSettings, game);
    this._adminPanel     = new AdminPanel(adminSettings, () => {
      game._world.markAllDirty();
    });

    this._buildDOM();
  }

  isOpen() { return this._open; }
  getGraphicsSettings() { return this._graphicsSettings; }

  open() {
    this._open = true;
    this._showRoot();
    this._el.classList.remove('hidden');
    if (document.pointerLockElement) document.exitPointerLock();
  }

  close() {
    this._open = false;
    this._el.classList.add('hidden');
    this._hideAllPanels();
    this._game._requestLock();
  }

  _buildDOM() {
    const root = document.createElement('div');
    root.style.cssText = 'text-align:center;padding:30px;border:2px solid #5af;background:#001;border-radius:8px;min-width:280px;';

    // Title
    const title = document.createElement('h2');
    title.style.cssText = 'color:#5af;margin-bottom:20px';
    title.textContent = '⏸ Pausa';
    root.appendChild(title);

    // Root button column
    const btnCol = document.createElement('div');
    btnCol.id = 'pause-btncol';
    btnCol.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    const btnResume    = makeBtn('Continuar');
    const btnGraphics  = makeBtn('Gráficos', '#555');
    const btnMaterials = makeBtn('Materiales', '#555');
    const btnMode      = makeBtn('Cambiar modo', '#555');

    btnResume.addEventListener('click',    () => this.close());
    btnGraphics.addEventListener('click',  () => this._openPanel(this._graphicsPanel));
    btnMaterials.addEventListener('click', () => this._openPanel(this._materialsPanel));
    btnMode.addEventListener('click',      () => this._openModeSelector());

    btnCol.append(btnResume, btnGraphics, btnMaterials);

    if (window.location.search.includes('admin=1')) {
      const btnAdmin = makeBtn('Admin 🔧', '#642');
      btnAdmin.addEventListener('click', () => this._openPanel(this._adminPanel));
      btnCol.appendChild(btnAdmin);
    }

    btnCol.appendChild(btnMode);
    root.appendChild(btnCol);

    // Panel area (hidden by default)
    const panelArea = document.createElement('div');
    panelArea.id = 'pause-panels';
    panelArea.style.cssText = 'display:none;text-align:left;';

    // Wrap each panel with a back button
    [this._graphicsPanel, this._materialsPanel, this._adminPanel].forEach(panel => {
      const wrapper = document.createElement('div');
      wrapper.style.display = 'none';

      const backBtn = document.createElement('button');
      backBtn.textContent = '← Volver';
      backBtn.style.cssText = 'margin-bottom:14px;padding:6px 14px;cursor:pointer;background:#333;color:#fff;border:none;border-radius:4px;font-size:13px;';
      backBtn.addEventListener('click', () => {
        wrapper.style.display = 'none';
        panel.hide();
        this._showRoot();
      });

      wrapper.appendChild(backBtn);
      wrapper.appendChild(panel.getElement());
      panelArea.appendChild(wrapper);
      panel._wrapper = wrapper;
    });

    root.appendChild(panelArea);
    this._root    = root;
    this._title   = title;
    this._btnCol  = btnCol;
    this._panelArea = panelArea;

    this._el.appendChild(root);
  }

  _showRoot() {
    this._title.style.display  = '';
    this._btnCol.style.display = 'flex';
    this._panelArea.style.display = 'none';
    this._hideAllPanels();
  }

  _hideAllPanels() {
    [this._graphicsPanel, this._materialsPanel, this._adminPanel].forEach(p => {
      if (p._wrapper) p._wrapper.style.display = 'none';
      p.hide();
    });
    // Remove any inline mode selector if present
    const sel = this._panelArea.querySelector('#pause-mode-sel');
    if (sel) sel.remove();
  }

  _openPanel(panel) {
    this._title.style.display  = 'none';
    this._btnCol.style.display = 'none';
    this._panelArea.style.display = 'block';
    this._hideAllPanels();
    panel._wrapper.style.display = 'block';
    panel.show();
  }

  _openModeSelector() {
    this._title.style.display  = 'none';
    this._btnCol.style.display = 'none';
    this._panelArea.style.display = 'block';
    this._hideAllPanels();

    const sel = document.createElement('div');
    sel.id = 'pause-mode-sel';
    sel.style.cssText = 'display:flex;flex-direction:column;gap:10px;';

    const back = document.createElement('button');
    back.textContent = '← Volver';
    back.style.cssText = 'margin-bottom:8px;padding:6px 14px;cursor:pointer;background:#333;color:#fff;border:none;border-radius:4px;font-size:13px;align-self:flex-start;';
    back.addEventListener('click', () => { sel.remove(); this._showRoot(); });

    const heading = document.createElement('p');
    heading.style.cssText = 'color:#ccc;margin:0 0 8px';
    heading.textContent = 'Seleccioná el nuevo modo:';

    sel.appendChild(back);
    sel.appendChild(heading);

    const modes = [
      { id: 'survival', label: 'Supervivencia', bg: '#28f' },
      { id: 'creative', label: 'Creativo',       bg: '#f82' },
      { id: 'inspector', label: 'Inspector',     bg: '#282' },
    ];
    modes.forEach(({ id, label, bg }) => {
      if (id === this._game.mode) return;
      const btn = makeBtn(label, bg);
      btn.addEventListener('click', () => {
        this._game.setMode(id);
        sel.remove();
        this.close();
      });
      sel.appendChild(btn);
    });

    this._panelArea.appendChild(sel);
  }
}
