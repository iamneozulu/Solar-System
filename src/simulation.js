import * as THREE from 'three';
import * as CELESTIAL from './celestialObjects.js';
import { PLANET_DATA } from './planetData.js';
import { MOON_INFO } from './moonData.js';
import { createStarfield } from './starfield.js';
import {
  PLANET_RADII_KM,
  PLANET_ORBITS_KM,
  unitsPerKm,
  displayRadius,
  MAIN_MOON_KM,
  BELT_AU,
  KUIPER_BELT_AU,
  AU_KM,
} from './scaleData.js';

const Sun = new CELESTIAL.Star("Sun", 15, 0.15, PLANET_DATA.Sun.color, "./static/images/sun.jpg");
const Mercury = new CELESTIAL.Planet("Mercury", 1, 69815000, (392000000 / 1.205), 3, 0.027, PLANET_DATA.Mercury.color, "./static/images/mercury.jpg");
const Venus = new CELESTIAL.Planet("Venus", 1.9, 108500000, (684000000 / 3.075), 0.05, 177.36, PLANET_DATA.Venus.color, "./static/images/venus.jpg");
const Earth = new CELESTIAL.Planet("Earth", 2, 150700000, (942000000 / 5), 0.05, 23.5, PLANET_DATA.Earth.color, "./static/images/earth.jpg");
const Lunar = new CELESTIAL.Moon(Earth, "Lunar", 1, 4, 2420000 * 50, 0.05, "#e0e0e0", "./static/images/moon.jpg");
const Mars = new CELESTIAL.Planet("Mars", 1.5, 207940000, (1440000000 / 9.4), 0.05, 25, PLANET_DATA.Mars.color, "./static/images/mars.jpg");
const Jupiter = new CELESTIAL.Planet("Jupiter", 7, 749370000 / 2, (4770000000 / 60), 0.05, 3.13, PLANET_DATA.Jupiter.color, "./static/images/jupiter.jpg");
const Saturn = new CELESTIAL.Planet("Saturn", 6.5, 1450400000 / 2, (9120000000 / 147), 0.05, 26.73, PLANET_DATA.Saturn.color, "./static/images/saturn.jpg");
const SaturnRingTexture = CELESTIAL.generateRingTexture();
const SaturnRing = new CELESTIAL.PlanetRing(Saturn, 1.2, 2.3, SaturnRingTexture);
const Uranus = new CELESTIAL.Planet("Uranus", 5, 2930100000 / 3, (18400000000 / 420), 0.05, 97.77, PLANET_DATA.Uranus.color, "./static/images/uranus.jpg");
const UranusRingTexture = CELESTIAL.generateRingTexture({ r: 138, g: 160, b: 178, alpha: 0.42 });
const UranusRing = new CELESTIAL.PlanetRing(Uranus, 1.6, 1.8, UranusRingTexture);
const Neptune = new CELESTIAL.Planet("Neptune", 5, 4472100000 / 3.5, (28100000000 / 825), 0.05, 28, PLANET_DATA.Neptune.color, "./static/images/neptune.jpg");
const NeptuneRingTexture = CELESTIAL.generateRingTexture({ r: 90, g: 105, b: 140, alpha: 0.4 });
const NeptuneRing = new CELESTIAL.PlanetRing(Neptune, 1.68, 2.62, NeptuneRingTexture);

const planets = [Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune];

for (const planet of planets) {
  planet.orbitInclination = PLANET_DATA[planet.name].inclination ?? 0;
}

const BASE_SIZES = {
  Sun: 15, Mercury: 1, Venus: 1.9, Earth: 2, Mars: 1.5,
  Jupiter: 7, Saturn: 6.5, Uranus: 5, Neptune: 5, Lunar: 1,
};
const BASE_ORBITS = { Lunar: 4 };
for (const planet of planets) BASE_ORBITS[planet.name] = planet.orbitRadius;

const BASE_BELT = {
  asteroid: { inner: 90, outer: 110 },
  kuiper: { inner: 500, outer: 600 },
};

const orbitPaths = planets.map(planet => {
  const path = CELESTIAL.createOrbitPath(planet.orbitRadius, PLANET_DATA[planet.name].color, null, planet.orbitInclination);
  path.userData.planet = planet;
  return path;
});

const asteroidBelt = new CELESTIAL.AsteroidBelt(1500, 90, 110, 0xb2b2b2, 0.5);
const kuiperBelt = new CELESTIAL.AsteroidBelt(15000, 500, 600, 0xb2b2b2, 0.2);

export const simulation = {
  Sun,
  planets,
  Lunar,
  SaturnRing,
  UranusRing,
  NeptuneRing,
  asteroidBelt,
  kuiperBelt,
  orbitPaths,
  simulationTime: 0,
  toScale: false,

  update(deltaTime) {
    this.simulationTime += deltaTime;
    this.Sun.update(deltaTime);
    for (const p of this.planets) p.update(deltaTime, this.simulationTime);
    this.Lunar.update(deltaTime, this.simulationTime);
    this.SaturnRing.update();
    this.UranusRing.update();
    this.NeptuneRing.update();
    this.asteroidBelt.update(deltaTime);
    this.kuiperBelt.update(deltaTime);
  },

  getAllObjects() {
    return [
      this.Sun,
      ...this.planets,
      this.Lunar,
      this.SaturnRing,
      this.UranusRing,
      this.NeptuneRing,
      this.asteroidBelt,
      this.kuiperBelt,
      ...this.orbitPaths,
    ];
  },

  setToScale(enabled) {
    if (enabled === this.toScale) return;
    this.toScale = enabled;

    const K = unitsPerKm();

    const resizeBody = (body, baseSize, newSize) => {
      body.size = newSize;
      body.scale.setScalar(baseSize ? newSize / baseSize : 1);
    };

    resizeBody(this.Sun, BASE_SIZES.Sun, enabled ? displayRadius(PLANET_RADII_KM.Sun) : BASE_SIZES.Sun);

    for (let i = 0; i < this.planets.length; i++) {
      const p = this.planets[i];
      const baseSize = BASE_SIZES[p.name];
      const baseOrbit = BASE_ORBITS[p.name];
      const newSize = enabled ? displayRadius(PLANET_RADII_KM[p.name]) : baseSize;
      const newOrbit = enabled ? PLANET_ORBITS_KM[p.name] * K : baseOrbit;
      p.orbitRadius = newOrbit;
      resizeBody(p, baseSize, newSize);
      CELESTIAL.setOrbitPathRadius(this.orbitPaths[i], newOrbit, p.orbitInclination);
    }

    for (const [key, name] of [['SaturnRing', 'Saturn'], ['UranusRing', 'Uranus'], ['NeptuneRing', 'Neptune']]) {
      const host = this.getObjectByName(name);
      this[key].scale.setScalar(enabled ? host.size / BASE_SIZES[name] : 1);
    }

    this.asteroidBelt.setRadii(
      enabled ? BELT_AU.inner * AU_KM * K : BASE_BELT.asteroid.inner,
      enabled ? BELT_AU.outer * AU_KM * K : BASE_BELT.asteroid.outer
    );
    this.kuiperBelt.setRadii(
      enabled ? KUIPER_BELT_AU.inner * AU_KM * K : BASE_BELT.kuiper.inner,
      enabled ? KUIPER_BELT_AU.outer * AU_KM * K : BASE_BELT.kuiper.outer
    );

    if (enabled) {
      const earth = this.getObjectByName('Earth');
      this.Lunar.size = Math.max(MAIN_MOON_KM.size * K, earth.size * 0.3);
      this.Lunar.scale.setScalar(this.Lunar.size / BASE_SIZES.Lunar);
      this.Lunar.orbitRadius = Math.max(MAIN_MOON_KM.orb * K, earth.size * 1.5);
    } else {
      this.Lunar.size = BASE_SIZES.Lunar;
      this.Lunar.scale.setScalar(1);
      this.Lunar.orbitRadius = BASE_ORBITS.Lunar;
    }
  },

  getObjectByName(name) {
    if (name === 'Sun') return this.Sun;
    if (name === 'Lunar') return this.Lunar;
    return this.planets.find(p => p.name === name);
  },
};