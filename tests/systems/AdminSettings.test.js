import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BLOCK_DATA, BLOCKS } from '../../src/world/BlockRegistry.js';

// Minimal localStorage mock
function makeLsStub() {
  const store = {};
  return {
    getItem: vi.fn(k => store[k] ?? null),
    setItem: vi.fn((k, v) => { store[k] = v; }),
    removeItem: vi.fn(k => { delete store[k]; }),
  };
}

describe('AdminSettings', () => {
  let ls;
  beforeEach(async () => {
    ls = makeLsStub();
    vi.stubGlobal('localStorage', ls);
    vi.resetModules();
  });

  it('returns default BLOCK_DATA color when no override set', async () => {
    const { AdminSettings } = await import('../../src/systems/AdminSettings.js');
    const a = new AdminSettings();
    expect(a.getColor(BLOCKS.REGOLITH)).toBe(BLOCK_DATA[BLOCKS.REGOLITH].color);
  });

  it('returns custom color after setColor', async () => {
    const { AdminSettings } = await import('../../src/systems/AdminSettings.js');
    const a = new AdminSettings();
    a.setColor(BLOCKS.REGOLITH, '#ff0000');
    expect(a.getColor(BLOCKS.REGOLITH)).toBe(0xff0000);
  });

  it('persists to localStorage on setColor', async () => {
    const { AdminSettings } = await import('../../src/systems/AdminSettings.js');
    const a = new AdminSettings();
    a.setColor(BLOCKS.IRON_ORE, '#aabbcc');
    expect(ls.setItem).toHaveBeenCalled();
    const saved = JSON.parse(ls.setItem.mock.calls.at(-1)[1]);
    expect(saved[String(BLOCKS.IRON_ORE)]).toBe(0xaabbcc);
  });

  it('resetAll removes all overrides and saves', async () => {
    const { AdminSettings } = await import('../../src/systems/AdminSettings.js');
    const a = new AdminSettings();
    a.setColor(BLOCKS.REGOLITH, '#ff0000');
    a.resetAll();
    expect(a.getColor(BLOCKS.REGOLITH)).toBe(BLOCK_DATA[BLOCKS.REGOLITH].color);
  });

  it('loads persisted colors on construction', async () => {
    ls.getItem.mockReturnValue(JSON.stringify({ [String(BLOCKS.STEEL_BLOCK)]: 0x112233 }));
    const { AdminSettings } = await import('../../src/systems/AdminSettings.js');
    const a = new AdminSettings();
    expect(a.getColor(BLOCKS.STEEL_BLOCK)).toBe(0x112233);
  });
});
