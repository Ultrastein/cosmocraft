import { BLOCKS } from './BlockRegistry.js';

export const PLANETS = [
  {
    id: 'terra-nova',
    name: 'Terra Nova',
    seed: 42,
    gravityScale: 1,
    atmosphere: {
      daySky: 0x0c0c23,
      nightSky: 0x04040f,
      fogNear: 40,
      fogFar: 100,
    },
    terrain: {
      baseHeight: 8,
      amplitude: 6,
      noiseScale: 32,
      surfaceBlock: BLOCKS.REGOLITH,
      crustBlock: BLOCKS.REGOLITH,
      ores: [
        { threshold: 0.75, block: BLOCKS.SILICON_CRYSTAL },
        { threshold: 0.60, block: BLOCKS.IRON_ORE },
      ],
    },
  },
  {
    id: 'luna-gris',
    name: 'Luna Gris',
    seed: 314,
    gravityScale: 0.16,
    atmosphere: {
      daySky: 0x080812,
      nightSky: 0x020208,
      fogNear: 55,
      fogFar: 130,
    },
    terrain: {
      baseHeight: 6,
      amplitude: 8,
      noiseScale: 24,
      surfaceBlock: BLOCKS.REGOLITH,
      crustBlock: BLOCKS.REGOLITH,
      ores: [
        { threshold: 0.68, block: BLOCKS.TITANIUM_ORE },
        { threshold: 0.50, block: BLOCKS.SILICON_CRYSTAL },
      ],
    },
  },
  {
    id: 'marte-rojo',
    name: 'Marte Rojo',
    seed: 628,
    gravityScale: 0.38,
    atmosphere: {
      daySky: 0x24120f,
      nightSky: 0x090408,
      fogNear: 35,
      fogFar: 90,
    },
    terrain: {
      baseHeight: 9,
      amplitude: 7,
      noiseScale: 36,
      surfaceBlock: BLOCKS.REGOLITH,
      crustBlock: BLOCKS.REGOLITH,
      ores: [
        { threshold: 0.78, block: BLOCKS.QUANTUM_CRYSTAL },
        { threshold: 0.55, block: BLOCKS.IRON_ORE },
      ],
    },
  },
  {
    id: 'glacius',
    name: 'Glacius',
    seed: 991,
    gravityScale: 0.5,
    atmosphere: {
      daySky: 0x10202d,
      nightSky: 0x030910,
      fogNear: 28,
      fogFar: 80,
    },
    terrain: {
      baseHeight: 10,
      amplitude: 5,
      noiseScale: 42,
      surfaceBlock: BLOCKS.ICE_BLOCK,
      crustBlock: BLOCKS.REGOLITH,
      ores: [
        { threshold: 0.70, block: BLOCKS.ICE_BLOCK },
        { threshold: 0.55, block: BLOCKS.SILICON_CRYSTAL },
      ],
    },
  },
  {
    id: 'vulcano',
    name: 'Vulcano',
    seed: 1201,
    gravityScale: 0.8,
    atmosphere: {
      daySky: 0x2c1005,
      nightSky: 0x0c0302,
      fogNear: 25,
      fogFar: 75,
    },
    terrain: {
      baseHeight: 7,
      amplitude: 9,
      noiseScale: 28,
      surfaceBlock: BLOCKS.REGOLITH,
      crustBlock: BLOCKS.REGOLITH,
      ores: [
        { threshold: 0.76, block: BLOCKS.QUANTUM_CRYSTAL },
        { threshold: 0.52, block: BLOCKS.TITANIUM_ORE },
      ],
    },
  },
];

export const DEFAULT_PLANET_ID = 'terra-nova';
export const DEFAULT_PLANET = PLANETS[0];

export function getPlanetById(id) {
  return PLANETS.find(planet => planet.id === id) ?? DEFAULT_PLANET;
}

export function normalizePlanetConfig(seedOrPlanet = DEFAULT_PLANET) {
  if (typeof seedOrPlanet === 'number') {
    return {
      ...DEFAULT_PLANET,
      seed: seedOrPlanet,
      terrain: { ...DEFAULT_PLANET.terrain },
      atmosphere: { ...DEFAULT_PLANET.atmosphere },
    };
  }

  return {
    ...DEFAULT_PLANET,
    ...seedOrPlanet,
    terrain: {
      ...DEFAULT_PLANET.terrain,
      ...(seedOrPlanet.terrain ?? {}),
    },
    atmosphere: {
      ...DEFAULT_PLANET.atmosphere,
      ...(seedOrPlanet.atmosphere ?? {}),
    },
  };
}
