const OXYGEN_DEPLETION = 2;    // per second
const ENERGY_DEPLETION = 1.5;  // per second
const HEALTH_DRAIN     = 5;    // per second when O2 or energy = 0

export class Survival {
  constructor() {
    this._oxygen      = 100;
    this._energy      = 100;
    this._temperature = 80;   // set on first update
    this._health      = 100;
  }

  update(dt, dayProgress) {
    this._oxygen      = Math.max(0, this._oxygen - OXYGEN_DEPLETION * dt);
    this._energy      = Math.max(0, this._energy - ENERGY_DEPLETION * dt);
    this._temperature = Math.round(50 + 30 * Math.cos(dayProgress * 2 * Math.PI));
    this._temperature = Math.max(0, Math.min(100, this._temperature));

    if (this._oxygen === 0 || this._energy === 0) {
      this._health = Math.max(0, this._health - HEALTH_DRAIN * dt);
    }
  }

  refillOxygen(amount)  { this._oxygen = Math.min(100, this._oxygen + amount); }
  refillEnergy(amount)  { this._energy = Math.min(100, this._energy + amount); }
  getOxygen()           { return this._oxygen; }
  getEnergy()           { return this._energy; }
  getTemperature()      { return this._temperature; }
  getHealth()           { return this._health; }
  isAlive()             { return this._health > 0; }
}
