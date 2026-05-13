import { describe, it, expect } from 'vitest';
import { Survival } from '../../src/systems/Survival.js';

describe('Survival', () => {
  it('starts at full oxygen, energy, health; temperature initialized to 80', () => {
    const s = new Survival();
    expect(s.getOxygen()).toBe(100);
    expect(s.getEnergy()).toBe(100);
    expect(s.getHealth()).toBe(100);
    // Constructor sets _temperature = 80 (= 50 + 30*cos(0), matching noon at dayProgress=0)
    expect(s.getTemperature()).toBe(80);
  });

  it('oxygen depletes over time', () => {
    const s = new Survival();
    s.update(10, 0); // 10 seconds, noon
    expect(s.getOxygen()).toBeLessThan(100);
    expect(s.getOxygen()).toBeGreaterThanOrEqual(0);
  });

  it('energy depletes over time', () => {
    const s = new Survival();
    s.update(10, 0);
    expect(s.getEnergy()).toBeLessThan(100);
    expect(s.getEnergy()).toBeGreaterThanOrEqual(0);
  });

  it('oxygen never goes below 0', () => {
    const s = new Survival();
    s.update(200, 0); // deplete way past 0
    expect(s.getOxygen()).toBe(0);
  });

  it('energy never goes below 0', () => {
    const s = new Survival();
    s.update(200, 0);
    expect(s.getEnergy()).toBe(0);
  });

  it('health drains when oxygen is 0', () => {
    const s = new Survival();
    s.update(200, 0); // drain oxygen to 0
    const healthAfterOxygenDepleted = s.getHealth();
    expect(healthAfterOxygenDepleted).toBeLessThan(100);
  });

  it('refillOxygen increases oxygen up to 100', () => {
    const s = new Survival();
    s.update(10, 0); // deplete a bit
    const before = s.getOxygen();
    s.refillOxygen(50);
    expect(s.getOxygen()).toBeGreaterThan(before);
    expect(s.getOxygen()).toBeLessThanOrEqual(100);
  });

  it('refillEnergy increases energy up to 100', () => {
    const s = new Survival();
    s.update(10, 0);
    const before = s.getEnergy();
    s.refillEnergy(50);
    expect(s.getEnergy()).toBeGreaterThan(before);
    expect(s.getEnergy()).toBeLessThanOrEqual(100);
  });

  it('temperature is based on dayProgress (cosine curve)', () => {
    const s = new Survival();
    s.update(0.001, 0);   // near noon
    const noonTemp = s.getTemperature();
    s.update(0.001, 0.5); // near midnight
    const midnightTemp = s.getTemperature();
    // Noon should be warmer than midnight
    expect(noonTemp).toBeGreaterThan(midnightTemp);
  });

  it('isAlive returns false when health reaches 0', () => {
    const s = new Survival();
    // Drain everything for a very long time
    s.update(1000, 0);
    expect(s.isAlive()).toBe(false);
  });
});
