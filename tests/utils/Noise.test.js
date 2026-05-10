import { describe, it, expect } from 'vitest';
import { SimplexNoise } from '../../src/utils/Noise.js';

describe('SimplexNoise', () => {
  it('noise2D returns values in roughly [-1, 1]', () => {
    const noise = new SimplexNoise(42);
    for (let i = 0; i < 200; i++) {
      const v = noise.noise2D(i * 0.13, i * 0.27);
      expect(v).toBeGreaterThanOrEqual(-1.1);
      expect(v).toBeLessThanOrEqual(1.1);
    }
  });

  it('noise2D is deterministic with same seed', () => {
    const n1 = new SimplexNoise(1234);
    const n2 = new SimplexNoise(1234);
    expect(n1.noise2D(3.5, 7.2)).toBe(n2.noise2D(3.5, 7.2));
    expect(n1.noise2D(0, 0)).toBe(n2.noise2D(0, 0));
  });

  it('different seeds produce different results', () => {
    const n1 = new SimplexNoise(1);
    const n2 = new SimplexNoise(2);
    expect(n1.noise2D(1.5, 2.5)).not.toBe(n2.noise2D(1.5, 2.5));
  });

  it('noise3D returns values in roughly [-1, 1]', () => {
    const noise = new SimplexNoise(99);
    for (let i = 0; i < 100; i++) {
      const v = noise.noise3D(i * 0.1, i * 0.2, i * 0.15);
      expect(v).toBeGreaterThanOrEqual(-1.1);
      expect(v).toBeLessThanOrEqual(1.1);
    }
  });
});
