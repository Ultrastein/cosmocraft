const STACK_MAX = 64;

export class Inventory {
  constructor() {
    this.slots = new Array(36).fill(null);
    this.selectedSlot = 0;
    this.creative = false;
  }

  setCreative(enabled, blockTypes = []) {
    this.creative = enabled;
    if (!enabled) return;

    this.slots.fill(null);
    blockTypes.slice(0, this.slots.length).forEach((blockType, index) => {
      this.slots[index] = { id: blockType, count: Infinity };
    });
    this.selectedSlot = 0;
  }

  addItem(blockType, count = 1) {
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (this.slots[i]?.id === blockType && this.slots[i].count < STACK_MAX) {
        const space = STACK_MAX - this.slots[i].count;
        const added = Math.min(space, count);
        this.slots[i].count += added;
        count -= added;
      }
    }
    for (let i = 0; i < this.slots.length && count > 0; i++) {
      if (!this.slots[i]) {
        const added = Math.min(STACK_MAX, count);
        this.slots[i] = { id: blockType, count: added };
        count -= added;
      }
    }
    return count <= 0;
  }

  removeItem(blockType, count = 1) {
    if (this.creative) return true;

    const total = this.slots.reduce((s, slot) =>
      s + (slot?.id === blockType ? slot.count : 0), 0);
    if (total < count) return false;

    for (let i = this.slots.length - 1; i >= 0 && count > 0; i--) {
      if (this.slots[i]?.id === blockType) {
        const removed = Math.min(this.slots[i].count, count);
        this.slots[i].count -= removed;
        count -= removed;
        if (this.slots[i].count === 0) this.slots[i] = null;
      }
    }
    return true;
  }

  getHotbarSlot(index) {
    return this.slots[index] ?? null;
  }

  getSelected() {
    return this.slots[this.selectedSlot] ?? null;
  }

  selectSlot(index) {
    if (index >= 0 && index < 9) this.selectedSlot = index;
  }
}
