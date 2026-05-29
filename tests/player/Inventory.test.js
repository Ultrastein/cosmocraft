import { describe, it, expect } from 'vitest';
import { Inventory } from '../../src/player/Inventory.js';
import { BLOCKS } from '../../src/world/BlockRegistry.js';

describe('Inventory', () => {
  it('starts empty', () => {
    const inv = new Inventory();
    expect(inv.getSelected()).toBeNull();
    for (let i = 0; i < 9; i++) expect(inv.getHotbarSlot(i)).toBeNull();
  });

  it('adds an item to the first free slot', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 5);
    expect(inv.slots[0]).toEqual({ id: BLOCKS.REGOLITH, count: 5 });
  });

  it('stacks items of same type up to 64', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.IRON_ORE, 50);
    inv.addItem(BLOCKS.IRON_ORE, 20);
    expect(inv.slots[0]).toEqual({ id: BLOCKS.IRON_ORE, count: 64 });
    expect(inv.slots[1]).toEqual({ id: BLOCKS.IRON_ORE, count: 6 });
  });

  it('removes items and clears empty slots', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 3);
    inv.removeItem(BLOCKS.REGOLITH, 3);
    expect(inv.slots[0]).toBeNull();
  });

  it('removeItem returns true when successful', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 10);
    expect(inv.removeItem(BLOCKS.REGOLITH, 5)).toBe(true);
  });

  it('removeItem returns false when not enough items', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.REGOLITH, 2);
    expect(inv.removeItem(BLOCKS.REGOLITH, 5)).toBe(false);
  });

  it('selectSlot changes the active hotbar slot', () => {
    const inv = new Inventory();
    inv.selectSlot(4);
    expect(inv.selectedSlot).toBe(4);
  });

  it('getSelected returns hotbar item at selectedSlot', () => {
    const inv = new Inventory();
    inv.addItem(BLOCKS.STEEL_BLOCK, 10);
    inv.selectSlot(0);
    expect(inv.getSelected()).toEqual({ id: BLOCKS.STEEL_BLOCK, count: 10 });
  });

  it('creative inventory does not consume blocks', () => {
    const inv = new Inventory();
    inv.setCreative(true, [BLOCKS.STEEL_BLOCK]);
    expect(inv.getSelected()).toEqual({ id: BLOCKS.STEEL_BLOCK, count: Infinity });
    expect(inv.removeItem(BLOCKS.STEEL_BLOCK, 1)).toBe(true);
    expect(inv.getSelected()).toEqual({ id: BLOCKS.STEEL_BLOCK, count: Infinity });
  });
});
